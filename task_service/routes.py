from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, List, Optional
import os
from pathlib import Path
from datetime import datetime # <--- Added datetime
from bson import ObjectId     # <--- Added ObjectId

from db import get_database
from schemas import (
    TaskCreate, TaskOut, TokenData, TaskStatus, TaskUpdate,
    TaskStatusUpdate, Role, CommentIn, CommentOut, AttachmentOut,
    NotificationOut, NotificationCreateInternal # <--- Added Notification Schemas
)
from models import (
    Task, PyObjectId, Comment, Attachment,
    Notification, NotificationType # <--- Added Notification Models
)
from security import (
    get_current_user, get_validated_team_leader, get_team_access_for_tasks,
    get_task_leader_only, authorize_comment_deletion
)
import httpx
import logging
logger = logging.getLogger("task_service")

router = APIRouter(prefix="/tasks")

UPLOAD_BASE_DIR = Path("task_files")
UPLOAD_BASE_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------
# NOTIFICATION HELPER (NEW)
# ---------------------------------------------------------
async def create_notification(db, user_id: str, title: str, message: str, link: str, type: NotificationType):
    note = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link,
        type=type,
        is_read=False,
        created_at=datetime.now()
    )
    await db["notifications"].insert_one(note.model_dump(by_alias=True))

# ---------------------------------------------------------
# NOTIFICATION ENDPOINTS (NEW)
# ---------------------------------------------------------
@router.get("/notifications", response_model=List[NotificationOut], tags=["notifications"])
async def get_my_notifications(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    cursor = db["notifications"].find({"user_id": current_user.username}).sort("created_at", -1).limit(50)
    notifications = await cursor.to_list(length=50)
    return [NotificationOut(id=str(n["_id"]), **n) for n in notifications]

@router.patch("/notifications/{note_id}/read", status_code=status.HTTP_204_NO_CONTENT, tags=["notifications"])
async def mark_notification_read(
    note_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    try:
        obj_id = ObjectId(note_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    await db["notifications"].update_one(
        {"_id": obj_id, "user_id": current_user.username},
        {"$set": {"is_read": True}}
    )
    return None

@router.post("/notifications/internal", status_code=status.HTTP_201_CREATED, tags=["internal"])
async def create_internal_notification(
    payload: NotificationCreateInternal,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    await create_notification(
        db, 
        payload.user_id, 
        payload.title, 
        payload.message, 
        payload.link, 
        NotificationType(payload.type)
    )
    return {"status": "ok"}

@router.delete("/notifications", status_code=status.HTTP_204_NO_CONTENT, tags=["notifications"])
async def clear_all_notifications(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    """
    Deletes ALL notifications for the current user.
    """
    # Delete all documents in 'notifications' collection where 'recipient' is the current user
    # Note: Ensure your notification model uses 'recipient' or 'user_id' to identify the owner
    await db["notifications"].delete_many({"user_id": current_user.username})
    
    return None

# ---------------------------------------------------------
# EXISTING TASK ROUTES
# ---------------------------------------------------------

# User can view all the tasks assigned to them, from all teams
@router.get("/me", response_model=List[TaskOut], tags=["tasks"])
async def list_my_assigned_tasks(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)],
    status: Optional[TaskStatus] = None, 
    sort_by_due: Optional[bool] = False, 
):
    query = {"assigned_to": current_user.username}
    
    if status:
        query["status"] = status.value 
        
    sort_criteria = []
    if sort_by_due:
        sort_criteria.append(("due_date", 1))

    tasks_cursor = db["tasks"].find(query)
    
    if sort_criteria: 
        tasks_cursor = tasks_cursor.sort(sort_criteria)

    tasks = await tasks_cursor.to_list(length=100)
    
    if not tasks:
        return []

    return [TaskOut(id=str(task["_id"]), **task) for task in tasks]

# User can see all the tasks of their team
@router.get("/team/{team_id}", response_model=List[TaskOut], tags=["tasks"])
async def list_tasks_by_team(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    validated_team_id: Annotated[str, Depends(get_team_access_for_tasks)], 
    status: Optional[TaskStatus] = None, 
    sort_by_due: Optional[bool] = False,
):
    query = {"team_id": validated_team_id}
    
    if status:
        query["status"] = status.value
        
    sort_criteria = []
    if sort_by_due:
        sort_criteria.append(("due_date", 1))

    tasks_cursor = db["tasks"].find(query)
    
    if sort_criteria: 
        tasks_cursor = tasks_cursor.sort(sort_criteria)

    tasks = await tasks_cursor.to_list(length=100)
    
    if not tasks:
        return []

    return [TaskOut(id=str(task["_id"]), **task) for task in tasks]


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED, tags=["tasks"])
async def create_task(
    task_data: TaskCreate, 
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)], 
    validated_team_id: Annotated[str, Depends(get_validated_team_leader)] 
):
    assigned_user_url = f"http://user_service:8001/users/{task_data.assigned_to}"
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {current_user.token}"}
            response = await client.get(assigned_user_url, headers=headers)
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"User '{task_data.assigned_to}' not found in the system.")
        
        user_data = response.json()
        if not user_data.get("active"):
            raise HTTPException(status_code=400, detail="Assigned user is not active and cannot be assigned a task.")
            
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="User service is unreachable.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error during user assignment validation.")

    new_task = Task(
        team_id=validated_team_id, 
        title=task_data.title,
        description=task_data.description,
        created_by=current_user.username,
        assigned_to=task_data.assigned_to,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.due_date,
        comments=[]
    )
    
    result = await db["tasks"].insert_one(new_task.model_dump(by_alias=True))
    created_task = await db["tasks"].find_one({"_id": result.inserted_id})

    # --- TRIGGER: NOTIFY ASSIGNEE ---
    if task_data.assigned_to != current_user.username:
        await create_notification(
            db,
            user_id=task_data.assigned_to,
            title="New Task Assigned",
            message=f"You were assigned to '{task_data.title}' by {current_user.username}",
            link=f"/teams/{task_data.team_id}/tasks/{result.inserted_id}",
            type=NotificationType.TASK_ASSIGNED
        )
    # --------------------------------

    logger.info("Task created : task_id=%s, team_id=%s, created_by=%s, assigned_to=%s",
    str(result.inserted_id),
    validated_team_id,
    current_user.username,
    task_data.assigned_to,
    )

    return TaskOut(
        id=str(created_task["_id"]),
        **created_task
    )

@router.get("/{task_id}", response_model=TaskOut, tags=["tasks"])
async def get_task_details(
    task_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    try:
        obj_id = PyObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    task_doc = await db["tasks"].find_one({"_id": obj_id})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    team_id = task_doc["team_id"]
    await get_team_access_for_tasks(team_id, current_user)

    return TaskOut(id=str(task_doc["_id"]), **task_doc)

@router.patch("/{task_id}", response_model=TaskOut, tags=["tasks"])
async def update_task_details(
    task_data: TaskUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)], 
    task_to_update: Task = Depends(get_task_leader_only)
):
    update_data = task_data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided.")
        
    if "assigned_to" in update_data:
        assigned_user = update_data["assigned_to"]
        
        user_service_url = f"http://user_service:8001/users/{assigned_user}"
        
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {current_user.token}"}
                response = await client.get(user_service_url, headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"User '{assigned_user}' is either invalid or not part of the team.")
            
            user_data = response.json()
            if not user_data.get("active"):
                raise HTTPException(status_code=400, detail="Assigned user is not active and cannot be assigned a task.")
                
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="User service is unreachable.")
            
    await db["tasks"].update_one(
        {"_id": task_to_update.id}, 
        {"$set": update_data}
    )
    
    updated_task_doc = await db["tasks"].find_one({"_id": task_to_update.id})
    return TaskOut(id=str(updated_task_doc["_id"]), **updated_task_doc)

@router.patch("/{task_id}/status", response_model=TaskOut, tags=["tasks"])
async def update_task_status(
    task_id: str,
    status_data: TaskStatusUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    try:
        obj_id = PyObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    task_doc = await db["tasks"].find_one({"_id": obj_id})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    task = Task(**task_doc)

    if current_user.username != task.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to change the status; only the assigned user can."
        )

    await db["tasks"].update_one(
        {"_id": task.id},
        {"$set": {"status": status_data.status}}
    )
    
    updated_task_doc = await db["tasks"].find_one({"_id": task.id})
    
    # --- TRIGGER: NOTIFY CREATOR ---
    if current_user.username != task.created_by:
        await create_notification(
            db,
            user_id=task.created_by,
            title="Task Status Changed",
            message=f"Task '{task.title}' marked as {status_data.status} by {current_user.username}",
            link=f"/teams/{task.team_id}/tasks/{task_id}",
            type=NotificationType.TASK_STATUS_CHANGED
        )
    # -------------------------------
    
    return TaskOut(id=str(updated_task_doc["_id"]), **updated_task_doc)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["tasks"])
async def delete_task(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    task_to_delete: Task = Depends(get_task_leader_only) 
):
    await db["tasks"].delete_one({"_id": task_to_delete.id})
    return None

@router.post("/{task_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED, tags=["comments"])
async def add_comment_to_task(
    task_id: str,
    comment_data: CommentIn,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    try:
        obj_id = PyObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    task_doc = await db["tasks"].find_one({"_id": obj_id}, projection={"team_id": 1})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    team_id = task_doc["team_id"]
    await get_team_access_for_tasks(team_id, current_user)

    new_comment = Comment(
        text=comment_data.text,
        created_by=current_user.username,
    )
    
    result = await db["tasks"].update_one(
        {"_id": obj_id},
        {"$push": {"comments": new_comment.model_dump(by_alias=True)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to add comment.")
    
    # --- TRIGGER: NOTIFY ASSIGNEE & CREATOR ---
    task_full = await db["tasks"].find_one({"_id": obj_id})
    assigned_to = task_full.get("assigned_to")
    created_by = task_full.get("created_by")
    task_title = task_full.get("title")

    # Notify Assignee (if it's not them commenting)
    if assigned_to and assigned_to != current_user.username:
        await create_notification(
            db,
            user_id=assigned_to,
            title="New Comment",
            message=f"{current_user.username} commented on '{task_title}'",
            link=f"/teams/{team_id}/tasks/{task_id}",
            type=NotificationType.NEW_COMMENT
        )
    
    # Notify Creator (if it's not them commenting AND they aren't the assignee)
    if created_by and created_by != current_user.username and created_by != assigned_to:
        await create_notification(
            db,
            user_id=created_by,
            title="New Comment",
            message=f"{current_user.username} commented on '{task_title}'",
            link=f"/teams/{team_id}/tasks/{task_id}",
            type=NotificationType.NEW_COMMENT
        )
    # ------------------------------------------

    return CommentOut(
        id=str(new_comment.id),
        text=new_comment.text,
        created_by=new_comment.created_by,
        created_at=new_comment.created_at
    )

@router.delete("/internal/cleanup-team/{team_id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
async def cleanup_team_tasks(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """ called when team service deletes a team.
    deletes all tasks related to a specific team ID,
    added because the tasks were still showing up for each user,
    even if the team the task belonged to had been deleted.
    """
    await db["tasks"].delete_many({"team_id": team_id})
    return None


@router.get("/{task_id}/comments", response_model=List[CommentOut], tags=["comments"])
async def get_all_task_comments(
    task_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    try:
        obj_id = PyObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    task_doc = await db["tasks"].find_one({"_id": obj_id}, projection={"team_id": 1})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    team_id = task_doc["team_id"]
    await get_team_access_for_tasks(team_id, current_user)
    
    task_with_comments = await db["tasks"].find_one(
        {"_id": obj_id}, 
        projection={"comments": 1}
    )
    
    if not task_with_comments or 'comments' not in task_with_comments:
        return []
        
    comments_list = task_with_comments['comments']
    return [CommentOut(id=str(comment["_id"]), **comment) for comment in comments_list]

@router.delete("/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["comments"])
async def delete_comment(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    task_id: Annotated[PyObjectId, Depends(authorize_comment_deletion)], 
    comment_id: str 
):
    comment_obj_id = PyObjectId(comment_id)
    result = await db["tasks"].update_one(
        {"_id": task_id}, 
        {"$pull": {"comments": {"_id": comment_obj_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete comment.")
        
    return None

@router.post("/{task_id}/attachments", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED, tags=["attachments"])
async def upload_task_attachment(
    task_id: str,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: TokenData = Depends(get_current_user),
):
    try:
        obj_id = PyObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    task_doc = await db["tasks"].find_one({"_id": obj_id}, projection={"team_id": 1})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")

    team_id = task_doc["team_id"]
    await get_team_access_for_tasks(team_id, current_user)

    task_dir = UPLOAD_BASE_DIR / str(task_id)
    task_dir.mkdir(parents=True, exist_ok=True)

    attachment_id = PyObjectId()
    safe_filename = file.filename or "attachment"
    stored_path = task_dir / f"{attachment_id}_{safe_filename}"

    file_bytes = await file.read()
    try:
        with open(stored_path, "wb") as f:
            f.write(file_bytes)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save file on server.")

    attachment = Attachment(
        id=attachment_id,
        filename=safe_filename,
        content_type=file.content_type or "application/octet-stream",
        path=str(stored_path),
        uploaded_by=current_user.username,
    )

    result = await db["tasks"].update_one(
        {"_id": obj_id},
        {"$push": {"attachments": attachment.model_dump(by_alias=True)}},
    )

    if result.modified_count == 0:
        try:
            os.remove(stored_path)
        except OSError:
            pass
        raise HTTPException(status_code=500, detail="Failed to attach file to task.")

    return AttachmentOut(
        id=str(attachment.id),
        filename=attachment.filename,
        content_type=attachment.content_type,
        uploaded_by=attachment.uploaded_by,
        uploaded_at=attachment.uploaded_at,
    )

@router.get("/{task_id}/attachments", response_model=List[AttachmentOut], tags=["attachments"])
async def list_task_attachments(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: TokenData = Depends(get_current_user),
):
    try:
        obj_id = PyObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    task_doc = await db["tasks"].find_one(
        {"_id": obj_id},
        projection={"team_id": 1, "attachments": 1},
    )
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")

    team_id = task_doc["team_id"]
    await get_team_access_for_tasks(team_id, current_user)

    attachments = task_doc.get("attachments", [])
    return [
        AttachmentOut(
            id=str(att["_id"]),
            filename=att["filename"],
            content_type=att["content_type"],
            uploaded_by=att["uploaded_by"],
            uploaded_at=att["uploaded_at"],
        )
        for att in attachments
    ]

@router.get("/{task_id}/attachments/{attachment_id}", response_class=FileResponse, tags=["attachments"])
async def download_task_attachment(
    task_id: str,
    attachment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: TokenData = Depends(get_current_user),
):
    try:
        task_obj_id = PyObjectId(task_id)
        attachment_obj_id = PyObjectId(attachment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task or attachment ID format.")

    task_doc = await db["tasks"].find_one(
        {"_id": task_obj_id},
        projection={"team_id": 1, "attachments": 1},
    )
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")

    team_id = task_doc["team_id"]
    await get_team_access_for_tasks(team_id, current_user)

    attachments = task_doc.get("attachments", [])
    attachment = next((a for a in attachments if a["_id"] == attachment_obj_id), None)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found.")

    file_path = attachment["path"]
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=410, detail="Attachment file no longer exists on server.")
    
    resolved = Path(file_path).resolve()
    base = UPLOAD_BASE_DIR.resolve()

    if base not in resolved.parents and resolved != base:
        raise HTTPException(status_code=500, detail="Invalid attachment path on server.")

    return FileResponse(
        path=file_path,
        media_type=attachment.get("content_type", "application/octet-stream"),
        filename=attachment.get("filename", "download"),
    )

@router.delete("/{task_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["attachments"])
async def delete_task_attachment(
    task_id: str,
    attachment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: TokenData = Depends(get_current_user),
):
    try:
        task_obj_id = PyObjectId(task_id)
        attachment_obj_id = PyObjectId(attachment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task or attachment ID format.")

    task_doc = await db["tasks"].find_one(
        {"_id": task_obj_id},
        projection={"team_id": 1, "attachments": 1}
    )
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found.")

    attachments = task_doc.get("attachments", [])
    target_attachment = next((a for a in attachments if a["_id"] == attachment_obj_id), None)
    
    if not target_attachment:
        raise HTTPException(status_code=404, detail="Attachment not found.")
    
    is_uploader = target_attachment["uploaded_by"] == current_user.username
    is_admin = current_user.role == Role.ADMIN
    
    is_leader = False
    if current_user.role == Role.TEAM_LEADER:
        team_id = task_doc["team_id"]
        try:
            team_service_url = f"http://team_service:8002/teams/{team_id}"
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {current_user.token}"}
                response = await client.get(team_service_url, headers=headers)
                if response.status_code == 200:
                    team_data = response.json()
                    if team_data.get("leader_id") == current_user.username:
                        is_leader = True
        except Exception:
            pass 

    if not (is_uploader or is_leader or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not authorized to delete this file."
        )

    file_path = Path(target_attachment["path"])
    try:
        if file_path.exists():
            os.remove(file_path)
    except Exception as e:
        logger.error(f"Failed to delete file from disk: {e}")

    await db["tasks"].update_one(
        {"_id": task_obj_id},
        {"$pull": {"attachments": {"_id": attachment_obj_id}}}
    )

    return None

