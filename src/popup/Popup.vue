<template>
<div class="popup-container">
  <iframe class="saladict-frame"
    name="saladict-frame"
    frameBorder="0"
    :src="frameSource"
    :style="{height: panelHeight + 'px'}"
  ></iframe>
  <div class="active-switch">
    <svg class="icon-qrcode" @mouseenter="showQRcode" @mouseleave="currentTabUrl = ''"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 612">
      <path d="M0 225v25h250v-25H0zM0 25h250V0H0v25z"/>
      <path d="M0 250h25V0H0v250zm225 0h25V0h-25v250zM87.5 162.5h75v-75h-75v75zM362 587v25h80v-25h-80zm0-200h80v-25h-80v25z"/>
      <path d="M362 612h25V362h-25v250zm190-250v25h60v-25h-60zm-77.5 87.5v25h50v-25h-50z"/>
      <path d="M432 497.958v-25h-70v25h70zM474.5 387h50v-25h-50v25zM362 225v25h250v-25H362zm0-200h250V0H362v25z"/>
      <path d="M362 250h25V0h-25v250zm225 0h25V0h-25v250zm-137.5-87.5h75v-75h-75v75zM0 587v25h250v-25H0zm0-200h250v-25H0v25z"/>
      <path d="M0 612h25V362H0v250zm225 0h25V362h-25v250zM87.5 524.5h75v-75h-75v75zM587 612h25V441h-25v171zM474.5 499.5v25h50v-25h-50z"/>
      <path d="M474.5 449.5v75h25v-75h-25zM562 587v25h50v-25h-50z"/>
    </svg>
    <span class="switch-title">{{ i18n('opt_app_active_title') }}</span>
    <input type="checkbox" id="opt-active" class="btn-switch" v-model="config.active">
    <label for="opt-active"></label>
  </div>
  <transition name="fade">
    <div class="qrcode-panel" v-if="currentTabUrl">
      <qriously :value="currentTabUrl" :size="250" />
      <p class="qrcode-panel-title">{{ i18n('popup_tab_title') }}</p>
    </div>
  </transition>
</div>
</template>

<script>
import {storage, message} from 'src/helpers/chrome-api'

export default {
  name: 'Popup',
  store: ['config', 'i18n'],
  data () {
    return {
      frameSource: chrome.runtime.getURL('panel.html'),
      currentTabUrl: ''
    }
  },
  watch: {
    config: {
      deep: true,
      handler () {
        storage.sync.set({config: this.config})
      }
    }
  },
  methods: {
    showQRcode () {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (tabs.length > 0) {
          this.currentTabUrl = tabs[0].url
        }
      })
    }
  },
  computed: {
    panelHeight () {
      const allDicts = this.config.dicts.all
      // header + each dictionary
      const preferredHeight = 30 + this.config.dicts.selected.reduce((sum, id) => {
        let preferredHeight = 0
        if (allDicts[id] && allDicts[id].preferredHeight) {
          preferredHeight = allDicts[id].preferredHeight + 20
        }
        return sum + preferredHeight
      }, 0)
      const maxHeight = 400
      return preferredHeight > maxHeight ? maxHeight : preferredHeight
    }
  },
  beforeCreate () {
    message.self.on('PANEL_READY', (data, sender, sendResponse) => {
      // trigger the paste command
      sendResponse({preload: this.config.baPreload, autoSearch: this.config.baAuto})
    })
  }
}
</script>

<style lang="scss">
/*------------------------------------*\
   Base
\*------------------------------------*/
html {
  margin: 0;
  padding: 0;
  overflow-y: scroll;
}

body {
  margin: 0;
  padding: 0;
  font-size: 14px;
  font-family: "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Hiragino Sans GB W3", "Microsoft YaHei UI", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
}

.saladict-frame {
  width: 400px;
  overflow: hidden;
  border: 0 none;
}

.qrcode-panel {
  position: fixed;
  bottom: 50px;
  left: 25px;
  padding: 10px;
  background: #fff;
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.8) 0px 4px 23px -6px;
}

.qrcode-panel-title {
  text-align: center;
  margin: 5px 0 0 0;
}

.active-switch {
  display: flex;
  align-items: center;
  position: relative;
  height: 56px;
  padding: 0 20px;
  background: #f9f9f9;
  box-shadow: inset 0 10px 6px -6px rgba(0,0,0,.13);
  user-select: none;
}

.icon-qrcode {
  width: 23px;
  margin-top: 3px;
  margin-right: 11px;
}

.switch-title {
  flex: 1;
  font-size: 1.5em;
  font-weight: bold;
  text-align: left;
  color: #333;
}

$switch-button-width: 63px;
$switch-button-height: 37px;
.btn-switch {
  // hide input
  position: absolute;
  z-index: -200000;
  opacity: 0;

  & + label {
    display: inline-block;
    width: $switch-button-width;
    height: $switch-button-height;
    position: relative;
    margin: auto;
    background-color: #ddd;
    border-radius: $switch-button-height;
    cursor: pointer;
    outline: 0;
    user-select: none;
  }

  & + label:before {
    content: '';
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
    bottom: 1px;
    right: 1px;
    background-color: #f1f1f1;
    border-radius: $switch-button-height;
    transition: background 0.4s;
  }

  & + label:after {
    content: '';
    display: block;
    position: absolute;
    height: $switch-button-height - 2px;
    width: $switch-button-height - 2px;
    background-color: #fff;
    border-radius: 100%;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: margin 0.4s;
  }

  &:checked + label:before {
    background-color: #8ce196;
  }

  &:checked + label:after {
    margin-left: $switch-button-width - $switch-button-height + 2px;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
