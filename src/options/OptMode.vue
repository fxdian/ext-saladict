<template>
  <div class="opt-item"><!-- 查词模式-->
    <div class="opt-item__header">
      <strong>{{ i18n('opt_mode_title') }}</strong>
    </div>
    <div class="opt-item__body">
      <div class="checkbox">
        <label class="checkbox-inline">
          <input type="checkbox" v-model="mode.icon"> {{ i18n('opt_mode_icon') }}
        </label>
        <label class="checkbox-inline">
          <input type="checkbox" v-model="mode.direct"> {{ i18n('opt_mode_direct') }}
        </label>
        <label class="checkbox-inline">
          <input type="checkbox" v-model="mode.double"> {{ i18n('opt_mode_double') }}
        </label>
        <label class="checkbox-inline">
          <input type="checkbox" v-model="mode.ctrl"> {{ i18n('opt_mode_ctrl') }}
        </label>
      </div>
      <div class="double-click-delay" :style="{height: mode.double ? '44px' : '0'}">
        <div class="input-group">
          <div class="input-group-addon">{{ i18n('opt_mode_double_click_delay') }}</div>
          <input type="number" min="1" class="form-control" v-model.number="doubleClickDelay">
          <div class="input-group-addon">{{ i18n('opt_unit_ms') }}</div>
        </div>
      </div>
    </div>
    <div class="opt-item__description-wrap">
      <p class="opt-item__description" v-html="i18n('opt_mode_description')"></p>
    </div>
  </div><!-- 查词模式-->
</template>

<script>
export default {
  store: {
    mode: 'config.mode',
    doubleClickDelay: 'config.doubleClickDelay',
    i18n: 'i18n'
  }
}
</script>
