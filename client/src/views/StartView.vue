<template>
  <section class="start-page">
    <div class="start-hero mb-12 mb-lg-16">
      <header class="start-hero-copy">
        <p class="eyebrow mb-5">Your family home base</p>
        <h1 class="page-heading mb-6">Everything shared.<br><span>Nothing missed.</span></h1>
        <p class="page-lede">One simple place for shared devices, screen time, and the chores that keep your day moving.</p>
      </header>

      <div class="hub-preview" aria-hidden="true">
        <div class="hub-preview-orbit hub-preview-orbit--one" />
        <div class="hub-preview-orbit hub-preview-orbit--two" />
        <div class="hub-preview-card hub-preview-card--main">
          <div class="preview-card-heading"><v-icon icon="mdi-home-heart" /><span>Today at home</span></div>
          <div class="preview-family-row">
            <span class="preview-person preview-person--blue">A</span>
            <span class="preview-person preview-person--violet">M</span>
            <span class="preview-person preview-person--coral">N</span>
            <span class="preview-person preview-person--mint">T</span>
          </div>
          <div class="preview-progress"><span /></div>
          <small>Everyone can see what comes next</small>
        </div>
        <div class="hub-preview-card hub-preview-card--chore"><v-icon icon="mdi-check-circle" color="success" /><span>Chore complete</span></div>
        <div class="hub-preview-card hub-preview-card--time"><v-icon icon="mdi-clock-outline" color="primary" /><span>1h 30m left</span></div>
      </div>
    </div>

    <div class="start-section-heading mb-5">
      <div><h2>Where would you like to go?</h2><p>Choose the space that fits what you need.</p></div>
    </div>

    <v-row class="start-grid">
      <v-col cols="12" md="7">
        <v-card class="panel-card action-card start-card start-card--family" to="/checkout">
          <v-card-text class="start-card-body">
            <div class="start-card-icon start-card-icon--family"><v-icon icon="mdi-account-group-outline" size="34" /></div>
            <div class="start-card-copy">
              <span class="start-card-label">For everyone</span>
              <h2>Family space</h2>
              <p>Choose a profile, finish chores, and check shared items in or out.</p>
            </div>
            <div class="start-profile-stack" aria-hidden="true">
              <span>A</span><span>M</span><span>N</span><span>+</span>
            </div>
          </v-card-text>
          <v-card-actions class="start-card-actions">
            <span>Open family space</span><v-icon icon="mdi-arrow-right" />
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="panel-card action-card start-card start-card--parent" to="/admin/login">
          <v-card-text class="start-card-body">
            <div class="start-card-icon start-card-icon--parent"><v-icon icon="mdi-shield-account-outline" size="32" /></div>
            <div class="start-card-copy">
              <span class="start-card-label">For parents and admins</span>
              <h2>Parent dashboard</h2>
              <p>Review activity, approve chores, and adjust schedules or allowances.</p>
            </div>
          </v-card-text>
          <v-card-actions class="start-card-actions">
            <span>Open dashboard</span><v-icon icon="mdi-arrow-right" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div class="start-footer mt-8">
      <div><v-icon icon="mdi-lock-outline" size="18" /><span>Private and self-hosted</span></div>
      <v-btn to="/about" variant="text" append-icon="mdi-arrow-right">About ExpressACC</v-btn>
    </div>
  </section>
</template>

<style scoped>
.start-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr);
  align-items: center;
  gap: clamp(48px, 8vw, 110px);
  min-height: 410px;
}

.start-hero-copy .page-heading span {
  color: rgb(var(--v-theme-primary));
}

.hub-preview {
  position: relative;
  min-height: 360px;
}

.hub-preview-orbit {
  position: absolute;
  border: 1px solid rgba(82, 105, 232, .15);
  border-radius: 50%;
}

.hub-preview-orbit--one {
  inset: 15px 25px 35px 15px;
}

.hub-preview-orbit--two {
  inset: 58px -8px 4px 72px;
  border-color: rgba(62, 181, 139, .18);
}

.hub-preview-card {
  position: absolute;
  background: var(--panel-bg);
  border: 1px solid var(--line);
  box-shadow: 0 18px 45px rgba(49, 67, 110, .13);
}

.hub-preview-card--main {
  top: 48px;
  right: 28px;
  left: 28px;
  padding: 28px;
  border-radius: 26px;
  transform: rotate(2deg);
}

.preview-card-heading,
.preview-family-row,
.hub-preview-card--chore,
.hub-preview-card--time,
.start-footer,
.start-footer > div,
.start-card-actions {
  display: flex;
  align-items: center;
}

.preview-card-heading {
  gap: 9px;
  color: var(--ink);
  font-weight: 800;
}

.preview-card-heading .v-icon {
  color: rgb(var(--v-theme-primary));
}

.preview-family-row {
  margin: 28px 0 24px;
}

.preview-person {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  margin-left: -7px;
  color: #fff;
  border: 4px solid var(--avatar-border);
  border-radius: 50%;
  font-size: .85rem;
  font-weight: 800;
}

.preview-person:first-child { margin-left: 0; }
.preview-person--blue { background: #6579e8; }
.preview-person--violet { background: #8e75db; }
.preview-person--coral { background: #ed8a76; }
.preview-person--mint { background: #57b995; }

.preview-progress {
  height: 8px;
  overflow: hidden;
  background: var(--preview-track);
  border-radius: 999px;
}

.preview-progress span {
  display: block;
  width: 68%;
  height: 100%;
  background: linear-gradient(90deg, #6075e8, #8f7ae0);
  border-radius: inherit;
}

.hub-preview-card--main small {
  display: block;
  margin-top: 13px;
  color: var(--muted);
}

.hub-preview-card--chore,
.hub-preview-card--time {
  z-index: 2;
  gap: 8px;
  padding: 13px 16px;
  border-radius: 15px;
  font-size: .8rem;
  font-weight: 750;
}

.hub-preview-card--chore {
  bottom: 32px;
  left: 0;
  transform: rotate(-3deg);
}

.hub-preview-card--time {
  top: 22px;
  right: 0;
  transform: rotate(3deg);
}

.start-section-heading h2 {
  font-size: clamp(1.55rem, 3vw, 2rem);
  font-weight: 760;
}

.start-section-heading p {
  margin: 5px 0 0;
  color: var(--muted);
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
  min-height: 340px;
}

.start-card--family {
  background: var(--family-card-bg) !important;
  border-color: var(--family-card-line) !important;
}

.start-card--parent {
  background: var(--parent-card-bg) !important;
  border-color: var(--parent-card-line) !important;
}

.start-card-body {
  position: relative;
  flex: 1 1 auto;
  padding: 30px;
}

.start-card-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin-bottom: 32px;
  border-radius: 19px;
}

.start-card-icon--family {
  color: rgb(var(--v-theme-primary));
  background: var(--blue-soft);
}

.start-card-icon--parent {
  color: rgb(var(--v-theme-secondary));
  background: var(--violet-soft);
}

.start-card-label {
  color: var(--muted);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.start-card-copy h2 {
  max-width: 13ch;
  margin-top: 8px;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 760;
  line-height: 1.05;
}

.start-card-copy p {
  max-width: 44ch;
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.6;
}

.start-profile-stack {
  display: flex;
  position: absolute;
  top: 30px;
  right: 30px;
}

.start-profile-stack span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-left: -8px;
  color: #fff;
  background: #687ce8;
  border: 3px solid var(--avatar-border);
  border-radius: 50%;
  font-size: .7rem;
  font-weight: 800;
}

.start-profile-stack span:nth-child(2) { background: #8d78d9; }
.start-profile-stack span:nth-child(3) { background: #ee8a76; }
.start-profile-stack span:nth-child(4) { color: var(--muted); background: var(--surface-soft); }

.start-card-actions {
  justify-content: space-between;
  min-height: 66px;
  padding: 18px 30px;
  color: rgb(var(--v-theme-primary));
  border-top: 1px solid var(--line);
  font-weight: 800;
}

.start-card--parent .start-card-actions {
  color: rgb(var(--v-theme-secondary));
}

.start-footer {
  justify-content: space-between;
  color: var(--muted);
}

.start-footer > div {
  gap: 8px;
  font-size: .84rem;
  font-weight: 650;
}

@media (max-width: 959px) {
  .start-hero {
    grid-template-columns: 1fr;
  }

  .hub-preview {
    width: min(480px, 100%);
    margin-inline: auto;
  }
}

@media (max-width: 599px) {
  .start-hero {
    gap: 24px;
    min-height: 0;
  }

  .hub-preview {
    min-height: 310px;
  }

  .hub-preview-card--main {
    right: 12px;
    left: 12px;
    padding: 24px;
  }

  .start-card {
    min-height: 320px;
  }

  .start-card-body {
    padding: 24px;
  }

  .start-profile-stack {
    top: 24px;
    right: 24px;
  }

  .start-profile-stack span {
    width: 34px;
    height: 34px;
  }

  .start-card-actions {
    padding: 16px 24px;
  }

  .start-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
