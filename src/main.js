// console.log shim
globalThis.console = class {
	static log(msg) {
		trace(msg, "\n");
	}
}

import http from "http/moddable"
import fs from "fs/moddable"

// import { addRemote } from 'api/addRemote'
// import { checkout } from 'api/checkout'
// import { currentBranch } from 'api/currentBranch'
// import { fetch } from 'api/fetch'
import { getRemoteInfo } from 'api/getRemoteInfo'
import { init } from 'api/init'
import { ModdableBuffer } from 'utils/ModdableBuffer'

import {} from 'piu/MC'
import config from "mc/config";
import Net from 'net'
import WiFi from 'wifi'
import Preference from 'preference'
import { System, File } from 'file'
import { VerticalScrollerBehavior } from 'scroller'

console.log(`maxPathLength=${System.config().maxPathLength}`)
console.log(`config.file.root=${config.file.root}`)

const ROOT = config.file.root

await fs.promises.writeFile(`${ROOT}/hello.txt`, 'Hello World\n', 'utf8')
await init({ fs, dir: ROOT })
console.log(JSON.stringify(await fs.promises.readdir(ROOT)))
debugger;

// // ATTN: UNCOMMENT THESE LINES TO SAVE YOUR WIFI INFORMATION TO SPI FLASH MEMORY
// Preference.set('wifi', 'ssid', 'PUT_YOUR_SSID_HERE');
// Preference.set('wifi', 'password', 'PUT_YOUR_WIFI_PASSWORD_HERE');

// Retrieve wifi info from flash memory
const ssid = Preference.get('wifi', 'ssid');
const password = Preference.get('wifi', 'password');

// Buffer shim
globalThis.Buffer = ModdableBuffer

// process.domain shim (used by 'async-lock'?!)
globalThis.process = Object.freeze({domain: null});

// Main code
const userAgent = 'git/isomorphic-git moddable-branch'
let string = ''
let stopInterval = false;

const monitor = new WiFi(
  {
    ssid,
    password,
    // channel: 8,
    // hidden: false
  },
  msg => {
    trace(msg + '\n')
    switch (msg) {
      case 'connect':
        title = 'Connecting'
        break // still waiting for IP address
      case 'gotIP':
        title = Net.get('IP')
        trace(`IP address ${Net.get('IP')}\n`)
        string = `IP address ${Net.get('IP')}\n`
				getRemoteInfo({
					http,
					// corsProxy: 'http://localhost:9998',
					/* this is interesting:
					date validation failed on received certificate
				/Users/wmhilton/code/Moddable-OpenSource/moddable/modules/crypt/ssl/ssl_handshake.js (495) # Exception: throw!
				*/
					url: 'https://github.com/isomorphic-git/test.empty',
					headers: {
						'User-Agent': userAgent
					}
				}).then(result => {
					string = JSON.stringify(result, null, 2)
          console.log(string)
          stopInterval = true
				});
        break
      case 'disconnect':
        title = 'Disconnected!'
        string = 'Oh dear!'
        break // connection lost
    }
  }
)


let title = 'Hello world'

const HomeScreen = Column.template($ => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  skin: new Skin({ fill: 'blue' }),
  contents: [
    Label(null, {
      top: 0,
      height: 40,
      left: 0,
      right: 0,
      string: $.title,
      style: new Style({
        font: 'semibold 16px Open Sans',
        vertical: 'middle',
        horizontal: 'center',
        color: '#FFFFFF',
      }),
    }),
    new Scroller(null, {
      anchor: 'VSCROLLER',
      scroll: $.scroll,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      active: true,
      backgroundTouch: true,
      clip: true,
      Behavior: VerticalScrollerBehavior,
      skin: new Skin({ fill: 'white' }),
      contents: [
        Text(null, {
          top: 0,
          left: 0,
          right: 0,
          style: new Style({
            font: '16px Open Sans',
            vertical: 'middle',
            horizontal: 'left',
            color: '#000000',
          }),
          string: $.string,
        }),
      ],
    }),
  ],
}))

class ApplicationBehavior extends Behavior {
  onCreate(application) {
    global.application = application
    // WiFi.mode = 1
    this.doNext(application, 'HOME', { title: '[title]', string })
    application.interval = 1000
    application.start()
  }

  onTimeChanged(application) {
    const data = {
      title,
      string,
    }
    if (this.data?.VSCROLLER?.scroll) {
      data.scroll = this.data.VSCROLLER.scroll
    }
    this.doNext(application, 'HOME', data)
  }

  doNext(application, nextScreenName, nextScreenData = {}) {
    application.defer('onSwitchScreen', nextScreenName, nextScreenData)
  }

  onSwitchScreen(application, nextScreenName, nextScreenData = {}) {
    if (application.length) application.remove(application.first)
    application.purge()
    switch (nextScreenName) {
      case 'HOME':
        application.add(new HomeScreen(nextScreenData))
        if (stopInterval) application.interval = 100000000
        break
    }
  }
}
Object.freeze(ApplicationBehavior.prototype)

export default function() {
  return new Application(null, {
    displayListLength: 25600,
    commandListLength: 2048,
    touchCount: 1,
    Behavior: ApplicationBehavior,
  })
}

