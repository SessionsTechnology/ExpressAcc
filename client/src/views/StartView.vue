<template>
  <section class="start-page">
    <header class="page-header start-hero mb-10">
      <div class="page-header-copy">
        <p class="eyebrow mb-4">Time, devices, and responsibilities</p>
        <h1 class="page-heading mb-5">A calmer way to manage shared screen time.</h1>
        <p class="page-lede">Kids check devices in and out, timers stay accurate, and completed chores can earn extra time after approval.</p>
      </div>
    </header>

    <v-row class="start-grid">
      <v-col cols="12" md="7">
        <v-card class="panel-card action-card start-card start-card--primary" to="/checkout">
          <v-card-text class="start-card-body">
            <v-avatar color="primary" variant="tonal" size="64" class="mb-8"><v-icon icon="mdi-gamepad-variant-outline" size="34" /></v-avatar>
            <h2 class="start-card-title mb-3">Check out or return an item</h2>
            <p class="muted">Choose your name, enter your PIN, and manage your device or shared item.</p>
          </v-card-text>
          <v-card-actions class="start-card-actions text-primary">
            <span class="start-card-cta">Open checkout <v-icon icon="mdi-arrow-right" size="20" /></span>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="panel-card action-card start-card start-card--secondary" to="/admin/login">
          <v-card-text class="start-card-body">
            <v-avatar color="secondary" variant="tonal" size="64" class="mb-8"><v-icon icon="mdi-shield-account-outline" size="34" /></v-avatar>
            <h2 class="start-card-title mb-3">Parent dashboard</h2>
            <p class="muted">Review checkouts, adjust time, approve chores, and change household settings.</p>
          </v-card-text>
          <v-card-actions class="start-card-actions text-secondary">
            <span class="start-card-cta">Open admin <v-icon icon="mdi-arrow-right" size="20" /></span>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div class="text-center mt-8"><v-btn to="/about" variant="text" color="medium-emphasis">About ExpressACC</v-btn></div>
  </section>
</template>

<style scoped>
.start-hero {
  max-width: 800px;
}

.start-grid > .v-col {
  display: flex;
}

.start-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.start-card--primary {
  border-top: 5px solid rgb(var(--v-theme-primary)) !important;
}

.start-card--secondary {
  border-top: 5px solid rgb(var(--v-theme-secondary)) !important;
}

.start-card-body {
  flex: 1 1 auto;
  padding: 32px;
}

.start-card-title {
  max-width: 19ch;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 750;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.start-card-actions {
  min-height: 0;
  padding: 0 32px 32px;
}

.start-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 750;
}

@media (max-width: 599px) {
  .start-card-body {
    padding: 24px;
  }

  .start-card-actions {
    padding: 0 24px 24px;
  }
}
</style>
