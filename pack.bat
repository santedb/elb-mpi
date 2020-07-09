@ECHO OFF


pakman --compile --optimize --source=.\ --output=.bin\elb.mpi.pak --keyFile=..\..\keys\fyfesoftware.santesuite.net.pfx --keyPassword=..\..\keys\fyfesoftware.santesuite.net.pass --embedcert --install
pakman --compose --source=elb.mpi.sln.xml -o .dist\elb.mpi.sln.pak --keyFile=..\..\keys\fyfesoftware.santesuite.net.pfx --embedCert --keyPassword=..\..\keys\fyfesoftware.santesuite.net.pass

