self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};
  } catch {
    data = {
      title: "A-Trader",
      message: event.data
        ? event.data.text()
        : "You have a new notification.",
    };
  }

  const title =
    data.title || "A-Trader";

  const options = {
    body:
      data.message
      || "You have a new notification.",

    icon: "/favicon.ico",

    badge: "/favicon.ico",

    tag:
      data.tag
      || "a-trader-notification",

    data: {
      url:
        data.url
        || "/alerts#notifications",
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options,
    ),
  );
});


self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification.data?.url
      || "/alerts#notifications";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((windowClients) => {
          for (
            const client
            of windowClients
          ) {
            if (
              "focus" in client
            ) {
              client.navigate(
                targetUrl,
              );

              return client.focus();
            }
          }

          return clients.openWindow(
            targetUrl,
          );
        }),
    );
  },
);
