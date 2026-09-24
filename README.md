# Basketball Scoreboard

A lightweight basketball scoreboard web app built for a projector display and a separate controller screen. The projector page is designed for live game presentation, while the controller page lets a scorekeeper adjust the clock, score, fouls, timeouts, team names, and colors from another device on the same network.

This project is intentionally simple to deploy and run on a Windows PC connected to projectors, while allowing a second laptop or tablet to act as the control surface without needing direct local access to the projector display.

## Features

- Live scoreboard display for a projector or large display
- Remote control view for updating the game from a separate device
- Clock controls and quarter tracking
- Score adjustments for both teams
- Foul tracking
- Timeout tracking
- Team name editing
- Team logo upload support
- Custom team colors
- Basic password protection on the controller screen
- Reset confirmation prompt to prevent accidental resets
- Automatic startup support for Windows

## Project overview

The app uses:

- Node.js
- Express for serving the web pages
- Socket.IO for real-time syncing between the projector and controller

The app has a single shared game state object that both views read from and update. When a controller action occurs, the server updates the shared state and pushes the new state to all connected clients. The projector view then re-renders from that server-driven state.

## How it works

At a high level:

- The projector page renders the scoreboard display
- The controller page sends actions such as increment score or set clock
- The server stores the game state in memory
- Socket.IO pushes state updates to all connected browsers
- The projector updates automatically to match the controller

This model makes the app easy to run locally while still supporting a second device on the same network.

## Main files

### server.js

This is the main server file. It:

- creates the Express app
- serves static files from the public folder
- starts the HTTP server
- initializes Socket.IO
- maintains the shared game state
- listens for controller commands
- emits the current game state to all connected clients
- manages the countdown clock

The server includes the controller authentication logic:

- username: Scorekeeper
- password: FBCS_FLC_Sc0re

This protects the controller route while leaving the projector screen public.

### scoreboardLogic.js

This file contains the game-state logic as pure functions. It is intentionally separated from the server layer so the game rules can be tested independently.

Key functions include:

- createInitialState()
- setTeamName()
- adjustScore()
- adjustFoul()
- adjustTimeouts()
- setRunning()
- setQuarter()
- setTeamColor()
- tickClock()

This separation keeps the state logic predictable and easier to maintain. The server does not do the math for scoreboard updates directly; it calls the logic module and stores the result.

### public/index.html

This is the projector view. It renders the actual scoreboard display with:

- quarter display
- game clock
- home and away team names
- score values
- fouls
- timeout indicators
- team logos
- custom color styling

### public/control.html

This is the controller page. It includes the inputs and buttons for:

- clock controls
- quarter updates
- score adjustments
- foul adjustments
- timeout adjustments
- team name changes
- logo uploads
- team color changes
- reset game

### public/app.js

This file handles rendering the projector display from the server state. It:

- listens for incoming Socket.IO state updates
- updates the scoreboard fields
- applies score animation for score changes
- updates team logos
- updates CSS variables for team colors

### public/control.js

This file handles all controller behavior. It:

- reads form inputs
- sends events to the server via Socket.IO
- updates the local preview of the selected colors
- triggers score, foul, and timeout changes
- sends the reset command and confirms before doing it

### public/styles.css

This file contains the visual styling for both the projector and controller pages. It defines:

- scoreboard layout
- team panel styling
- color theming through CSS variables such as --home-color and --away-color
- logo sizing
- controller panel layout and spacing
- visual polish for the scoreboard presentation

## How to install

### Prerequisites

You need:

- a Windows PC for the projector setup
- Node.js LTS installed on that machine
- the project files copied to the machine
- a local network connection between the projector PC and the controller device

### Install steps

1. Download or copy this project folder to the projector PC.
2. Open PowerShell in the project folder.
3. Run:

```powershell
npm install
```

This installs the required dependencies defined in [package.json](package.json).

## How to launch the app

From the project folder, run:

```powershell
node server.js
```

Once the server is running, open:

- projector view: http://localhost:3000/
- controller view: http://localhost:3000/control

## Windows startup setup

To have the scoreboard start automatically when the projector PC starts up, a Windows startup shortcut is included.

### Startup script

The repository includes a batch file named startup-scoreboard.bat that launches the app in the background.

This file is intended to be placed in the Windows Startup folder so it runs automatically when the user logs in.

Typical contents:

```bat
@echo off
cd /d "C:\Users\Tommy\Desktop\Scoreboard"
start /B "" "C:\Program Files\nodejs\node.exe" "server.js"
```

This keeps the app running without a visible terminal window.

### Startup folder setup

To create the shortcut:

```powershell
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder 'Scoreboard.lnk'
$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'C:\Users\Tommy\Desktop\Scoreboard\startup-scoreboard.bat'
$shortcut.WorkingDirectory = 'C:\Users\Tommy\Desktop\Scoreboard'
$shortcut.Save()
```

This makes the application launch automatically for that Windows user.

## Using it during a game

### Projector display

Open the projector page on the display machine. This view is intended to be visible to the audience and should be the full-screen projector feed.

### Controller

On the laptop or other device, open the controller page at:

```text
http://<projector-pc-ip>:3000/control
```

Then log in with:

- username: Scorekeeper
- password: FBCS_FLC_Sc0re

You can then:

- start or pause the clock
- set the time and quarter
- adjust scores
- track fouls
- adjust team timeouts
- update team names
- upload team logos
- change team colors
- reset the game with confirmation

## Troubleshooting

### Port already in use

If the app says that port 3000 is already in use, stop any existing Node process and restart the app:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
node server.js
```

### Controller not connecting

Make sure:

- both devices are on the same local network
- the projector PC IP is correct
- firewall is not blocking port 3000
- the projector PC server is running

### Projector page not updating

Refresh the projector tab and make sure the browser is connected to the same server instance. The server state is shared in memory, so if the app was restarted, the live state resets.

## Summary

This project is a simple but effective scoreboard tool built for basketball use. It gives you:

- a polished projector display
- a separate control interface
- real-time syncing over a local network
- easy Windows startup setup for unattended use

It is designed specifically for an environment where the scoreboard needs to be shown on a projector, but controlled by a person using a different laptop or device.
