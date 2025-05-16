Spesifikas tested:

- Java 17
- Nodejs 18.18.0

# HOW TO BUILD RELEASE AND INSTALL??

1. cd android/ && ./gradlew clean
2. ./gradlew app:assembleRelease || ./gradlew assembleRelease || ./gradlew bundleRelease
3. cd ..
4. adb install -r android/app/build/outputs/apk/release/app-release.apk
