const { withAndroidManifest } = require("@expo/config-plugins");

// Loading the ~77MB TFLite contaminant-detection model through RN's Android
// asset bridge involves transient Java-side buffer copies that exceed the
// default ~192MB heap ceiling (OutOfMemoryError in Arrays.copyOf). This
// raises the app's heap ceiling so that load succeeds on-device.
function withAndroidLargeHeap(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application?.$) {
      application.$["android:largeHeap"] = "true";
    }
    return config;
  });
}

module.exports = withAndroidLargeHeap;
