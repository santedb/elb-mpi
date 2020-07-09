## Government of Elbonia SanteMPI Sample Applet

This applet represents a sample SanteMPI customization for the fake country Elbonia (see: Dilber Cartoon Strip). The applet provides examples of:

* Generating new Identifiers when patients are registered
* Adding additional information to patients when registered
* Customizing the login screen and branding of the SanteMPI admin panel
* Adding custom dashboard panel objects
* Adding a new tab to the patient summary screen

## Using

To use this sample, download the SanteDB SDK (2.0.25 or newer) and run the sdb-ade command with:

```
sdb-ade --ref=org.santedb.admin.sln.pak --applet=<<path-to-this-repo>>
```

To build a release copy of the solution:

1. Clone the https://github.com/santedb/applets project
2. Clone the https://github.com/santedb/santempi project
3. Clone the https://github.com/santedb/santeguard project
4. Open the SanteDB SDK Command Prompt
5. In the applets/ directory run the pack.bat file
6. In the santempi/ directory run the pack.bat file
7. In the santeguard/ directory run the pack.bat file
8. In this directory run the pack.bat file
9. Copy the contents of the .dist/ directory to the applets/ directory on your SanteDB iCDR server