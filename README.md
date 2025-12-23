In order to run the application, firstly you have to build and raise the Docker containers:
```cd cloudAndFog_PMS/```
```docker-compose up --build```
And the app will be available at http://localhost:5173

You will **NOT** need to download anything manually, just run the above command and every single requirement/dependency will be downloaded, according to the requirements.txt file of each of the 4 services (front end, user, task, team services).

In the ```/backups``` directory, there's backups of the latest versions of both MongoDB and mySQL databases, in case you decide to wipe all the volumes and then want to restore the databases.

Once the containers are up, you can either head to localhost:80 (HTTP) or localhost:5173 (Vite).
ATTENTION: It is more preferrable that you access the app via Vite, since it offers hot-reloading in case you want to change something in the code, whereas the HTTP access will simply provide you the as-is version, unless you reload the containers.

When you're done with the app, remember to run ```docker-compose down```.

