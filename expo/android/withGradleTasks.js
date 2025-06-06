const { withAppBuildGradle } = require("@expo/config-plugins");
const generateCode = require("@expo/config-plugins/build/utils/generateCode");

const resolveAppGradleString = (options) => {
    // for React Native 0.71, the file value now contains "jetified-react-android" instead of "jetified-react-native"
    const rnJetifierName = options?.android?.legacyJetifier ? "jetified-react-native" : "jetified-react-android";

    const gradleString = `tasks.whenTaskAdded((tas -> {
        // when task is 'mergeLocalDebugNativeLibs' or 'mergeLocalReleaseNativeLibs'
        if (tas.name.contains("merge") && tas.name.contains("NativeLibs")) {
            tasks.named(tas.name) {it
                doFirst {
                    java.nio.file.Path notNeededDirectory = it.externalLibNativeLibs
                            .getFiles()
                            .stream()
                            .filter(file -> file.toString().contains("${rnJetifierName}"))
                            .findAny()
                            .orElse(null)
                            .toPath();
                    java.nio.file.Files.walk(notNeededDirectory).forEach(file -> {
                        if (file.toString().contains("libc++_shared.so")) {
                            java.nio.file.Files.delete(file);
                        }
                    });
                }
            }
        }
    }))`;

    return gradleString;
};

const withGradleTasks = (config, options) => {
    return withAppBuildGradle(config, (config) => {
        const len = config.modResults.contents.split("\n").length;
        const newCode = generateCode.mergeContents({
            tag: "withVlcMediaPlayer",
            src: config.modResults.contents,
            newSrc: resolveAppGradleString(options),
            anchor: "",
            offset: len - 1,
            comment: "//",
        });

        config.modResults.contents = newCode.contents;

        return config;
    });
};

module.exports = withGradleTasks;
