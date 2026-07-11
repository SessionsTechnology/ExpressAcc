<template>
  <section>
    <p class="eyebrow mb-4">Time, devices, and responsibilities</p>
    <h1 class="page-title mb-5">A calmer way to manage shared screen time.</h1>
    <p class="page-subtitle mb-10">Kids check devices in and out, timers stay accurate, and completed chores can earn extra time after approval.</p>
    <v-row>
      <v-col cols="12" md="7">
        <v-card class="glass-card action-card pa-3 pa-sm-7" to="/checkout">
          <v-card-text>
            <v-avatar color="primary" variant="tonal" size="64" class="mb-8"><v-icon icon="mdi-gamepad-variant-outline" size="34" /></v-avatar>
            <h2 class="text-h4 mb-3">Check out or return an item</h2>
            <p class="muted">Choose your name, enter your PIN, and manage your device or shared item.</p>
          </v-card-text>
          <v-card-actions><v-btn color="primary" append-icon="mdi-arrow-right">Open checkout</v-btn></v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="glass-card action-card pa-3 pa-sm-7" to="/admin/login">
          <v-card-text>
            <v-avatar color="secondary" variant="tonal" size="64" class="mb-8"><v-icon icon="mdi-shield-account-outline" size="34" /></v-avatar>
            <h2 class="text-h4 mb-3">Parent dashboard</h2>
            <p class="muted">Review checkouts, adjust time, approve chores, and change household settings.</p>
          </v-card-text>
          <v-card-actions><v-btn color="secondary" append-icon="mdi-arrow-right">Open admin</v-btn></v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div class="text-center mt-8"><v-btn to="/about" variant="text" color="medium-emphasis">About ExpressACC</v-btn></div>
  </section>
</template>
