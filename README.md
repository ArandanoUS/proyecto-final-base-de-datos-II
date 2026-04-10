# proyecto-final-base-de-datos-II

Deben de tener Nodejs instalado y realizar el comando de 
npm init -y
npm install express mssql cors kafkajs

Una vez instalado y con el Docker funcionando. ejecutan el archivo .bat
es necesario que la carpeta kafka que se encuenta dentro del github la muevan al directorio c: antes de empezar.
en caso de tener problemas con el kafka no ejecutandose. asegurense de realizar en un cmd primero los siguientes comandos:
"cd C:\kafka"
".\bin\windows\kafka-storage.bat random-uuid"
les entregara una uuid random que utilizaran en el siguiente comando:
".\bin\windows\kafka-storage.bat format -t UUID -c .\config\server.properties"
remplacen UUID por la que les entrego los comandos anteriores y una vez realizado deberian poder utilizar el kafka sin problemas.
