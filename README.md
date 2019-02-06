# Pump-Monitoring-System
This project is a system for remotely monitoring an experimental pump loop.

#Components
## Data Source Sim
This is an application for simulating the transmission of data from the loop itself. This functionality in the real system is performed by a LabView application which directly monitors sensors connected to the loop.

## Desktop Application
This is the user-facing interface for the application. It is implemented using HTML, CSS, JavaScript, and Electron.

## Server
This is the server application which facillitates the connection between the LabView application and the user application. It formats and transmits the data, handles authentication, and file management.
