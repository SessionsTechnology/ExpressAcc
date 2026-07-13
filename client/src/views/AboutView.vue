<template>
  <v-row justify="center">
    <v-col cols="12" md="9">
      <header class="mb-8">
        <p class="eyebrow mb-4">About ExpressACC</p>
        <h1 class="page-title mb-5">Built for shared responsibility.</h1>
        <p class="page-lede">A practical, self-hosted home base for families, classrooms, churches, and other small communities.</p>
      </header>
      <v-card class="panel-card about-card">
        <v-card-text class="pa-5 pa-sm-8">
          <p class="about-intro mb-7">ExpressACC keeps shared-item checkout, screen time, and chore rewards in one clear place—so everyone knows what is available and what comes next.</p>
          <div class="about-grid">
            <div class="about-point"><v-avatar color="primary" variant="tonal"><v-icon icon="mdi-account-check-outline" /></v-avatar><div><h2>Self service</h2><p>Users manage their own items and can always see today’s remaining allowance.</p></div></div>
            <div class="about-point"><v-avatar color="secondary" variant="tonal"><v-icon icon="mdi-view-dashboard-outline" /></v-avatar><div><h2>One clear view</h2><p>Admins review checkouts, adjust schedules, and approve chore rewards from one dashboard.</p></div></div>
            <div class="about-point"><v-avatar color="accent" variant="tonal"><v-icon icon="mdi-home-lock" /></v-avatar><div><h2>Stored locally</h2><p>Operational data stays in your installation and can be backed up from Admin Settings.</p></div></div>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-5 px-sm-8 pb-sm-8"><v-btn to="/" color="primary" prepend-icon="mdi-arrow-left">Back home</v-btn></v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.about-intro { max-width: 760px; font-family: "Avenir Next", Inter, "Segoe UI", sans-serif; font-size: clamp(1.2rem, 2.5vw, 1.55rem); font-weight: 700; line-height: 1.45; letter-spacing: -.025em; }
.about-grid { display: grid; gap: 14px; }
.about-point { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 15px; align-items: start; padding: 18px; background: var(--surface-soft); border: 1px solid var(--line); border-radius: 16px; }
.about-point h2 { margin-bottom: 4px; font-size: 1.05rem; }
.about-point p { margin: 0; color: var(--muted); line-height: 1.55; }
</style>
