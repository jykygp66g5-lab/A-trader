import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "ams" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "ams", sizeMB: 500 });
  const ATrader = service("A-trader", {
    source: github("jykygp66g5-lab/A-trader", { checkSuites: false, rootDirectory: "backend" }),
    preDeploy: "alembic upgrade head",
    start: "uvicorn main:app --host 0.0.0.0 --port $PORT",
    replicas: { "ams": 1 },
    networking: { privateNetworkEndpoint: "a-trader" },
    env: {
      DATABASE_URL: preserve(),
      FRONTEND_URL: preserve(),
      JWT_SECRET_KEY: preserve(),
      VAPID_PRIVATE_KEY: preserve(),
      VAPID_PUBLIC_KEY: preserve(),
      VAPID_SUBJECT: preserve(),
    },
  });
  const AlertWorker = service("Alert-worker", {
    source: github("jykygp66g5-lab/A-trader", {
      checkSuites: false,
      rootDirectory: "backend",
    }),
    start: "python -m alerts.worker",
    replicas: { "ams": 1 },
    networking: { privateNetworkEndpoint: "alert-worker" },
    env: {
      DATABASE_URL: Postgres.env.DATABASE_URL,
      ALERT_CHECK_INTERVAL_SECONDS: "60",
      VAPID_PRIVATE_KEY: preserve(),
      VAPID_PUBLIC_KEY: preserve(),
      VAPID_SUBJECT: preserve(),
    },
  });

  return project("intelligent-reverence", {
    resources: [ATrader, AlertWorker, Postgres, postgresVolume],
  });
});
