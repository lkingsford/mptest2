import { Client } from 'boardgame.io/client';
import { State } from 'boardgame.io';
import { SocketIO } from 'boardgame.io/multiplayer'
import { EmuBayRailwayCompany, IEmuBayState } from '../game/game';
import { Board } from './board';
import { Ui } from './ui';

import * as PIXI from 'pixi.js'

localStorage.debug = '*';

class EmuBayRailwayCompanyClient {
    private client: any;
    private rootElement: HTMLElement;
    constructor(rootElement: HTMLElement, mpAddress?: string, playerID?: string, matchId?: string, numPlayers: number = 4 ) {
        this.rootElement = rootElement;
        if (!mpAddress) {
            // Hotseat
            this.client = Client({ game: EmuBayRailwayCompany, numPlayers: numPlayers });
        } else {
            this.client = Client({ game: EmuBayRailwayCompany, multiplayer: SocketIO({server: mpAddress}), matchID: matchId, playerID: playerID});
        }
        this.client.start();
    }

    public pixiApp = new PIXI.Application({backgroundColor: 0xEEEEFF, width: 1000, height: 1000});

    public startLoop(resources: { [index: string]: PIXI.LoaderResource }): void {
        let mapState: Board = new Board(this.pixiApp, resources);
        let theUi = new Ui()
        mapState.start();
        // Subscribe in this order, as UI may change things the board needs
        this.client.subscribe((state: State) => {
            if (state === null) return;
            theUi.update(state.G as IEmuBayState, state.ctx, this.client, mapState)
        });
        this.client.subscribe((state: State) => {
            if (state === null) return;
            mapState.drawMap(state.G as IEmuBayState, state.ctx);
        });
    }
}

const appElement: HTMLElement = document.getElementById('app')!;
const params = new URLSearchParams(window.location.search);
var app: EmuBayRailwayCompanyClient;
if (params.has("matchId") && params.has("playerId")) {
    // Multiplayer
    app = new EmuBayRailwayCompanyClient(appElement, `${window.location.host}`, params.get('playerId')!, params.get("matchId")!);
} else
{
    // Hotseat
    app = new EmuBayRailwayCompanyClient(appElement);
}


const loader = PIXI.Loader.shared;
Board.addResources(loader);


loader.load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
    console.log("Resources loaded");
    Board.getTextures(loader.resources)
    app.startLoop(loader.resources);
  })

  

document.querySelector("#board")?.appendChild(app.pixiApp.view)