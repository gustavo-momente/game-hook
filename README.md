# :anchor: GameHook
GameHook allows you to fetch information in any game you are currently playing from the popular emulator "RetroArch" in real-time via WebAPI.

> GameHook is still in early stages of development!

![Image](https://i.imgur.com/PP4qJEo.png | width=800)

## How do I get it?
```git clone --recursive https://github.com/chris062689/game-hook.git```

```npm update```
## How do I check for updates?
```git pull```

## Quick-Start Guide
1. Download and install [RetroArch](http://www.libretro.com/index.php/retroarch-2/).
2. Open RetroArch, set Network CMD Enable to true within Settings.
3. Start your game using a compatable core.
4. Apply the example configuration below, or your own based on the game you'd like to use.
5. Start the GameHook server and verify it has connected to the driver.
6. Open an approperate client _(inside the /data/clients folder, often an HTML file.)_

## What are some examples of what GameHook do?

There are example scripts and clients included.
- `Example Clients` - Inside of the /data/clients folder, clients are typically HTML files. You can see examples for:
    - `Pokemon Sidebar` - A sidebar used for video game streamers and Pokemon. Will display common information about the Pokemon game you are playing as a sidebar that can easily integrate into OBS or Xsplit.
- `Example Scripts` - Inside of the /data/scripts folder, you can see examples for:
    - `Pokemon Red / Blue Nuzlocke Mode` - A script that enforces "Nuzlocke" rules from Pokemon. This enforces all main Nuzlocke rules automatically including: Disallow use of "dead" Pokemon, disallow captures after first encounters per Route.
    - `Pokemon Red / Blue Text` - A script that shows how to modify the ROM to change certain menu options.
    - `Dragon Warrior 1 Stats` - A script that changes your stats for Dragon Warrior 1. Also detects when you stand on chests, stairs, etc.

## How do I set up my config?
Within the GameHook folder, open up `settings.js`.
There are the following options available:
- **Log Level** - Indicates the amount of logging that should be done. Useful for debugging.
    - Default Value: `'info'`
- **Driver File** - The path to the driver
    - Default Value: `'./drivers/retroarch.js'`
- **Mapper File** - The path to the mapper
    - Example: `'./data/mappers/pokemon_rby.js'`)
- **Scripts** - A list of scripts to automatically be ran.
    - Example: `['./data/scripts/pokemon_rby_nuzlocke.js']`

An example configuration would like like this:
```
exports.log_level = 'info';
exports.driver_file = './drivers/retroarch.js';
exports.mapper_file = './data/mappers/pokemon_rby.json';
exports.scripts = ['./data/scripts/pokemon_rby_nuzlocke.js'];
```

## Technical Information
The GameHook server exports a live-feed of your game through a Web API / JSON.

### Internal Components of the GameHook Server:
- `Mapper` - The mapper file is what translates the RAM (Random Access Memory) of the game you are currently playing into something readable. This mapper file contains what type of data should be displayed (string, integer, decimal, references, etc.) and any translation that needs to occur. _This mapper file is specific to the game you are playing_
- `Driver` - The driver binds the mapper file to a specific emulator or process. This module handles reading and writing RAM, and translating according to the mapper file.
- `User Scripts` - GameHook can be customized further by creating your own scripts to interact with the game based off of the translated values in the mapper file. _See the /data/scripts folder for more information on how to write your own._

### Internal Components of the GameHook Client:
Because the GameHook server is served through Web API / JSON, any Web API enabled platform can leverage the GameHook server.
_See the /data/clients folder for more information on how to write your own._


> Program your own scripts to interact with your favorite games!
![Image](https://i.imgur.com/brB5kJH.png | width=800)
