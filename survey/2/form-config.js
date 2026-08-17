(function () {
  "use strict";

  const config = window.VISUAL_SURVEY_CONFIG;
  if (!config) throw new Error("Survey configuration must load before form configuration.");
  config.formId = 2;
  config.responseSchemaVersion = 2;
})();
