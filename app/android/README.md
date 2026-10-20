# S.A Gym — Android

Open this folder (`app/android`) in Android Studio.

## Toolchain

- Gradle **9.1.0** (supports Android Studio’s bundled **JDK 25**)
- Android Gradle Plugin **8.13.2**
- App compile/target: Java **17**

If sync still complains, use **File → Invalidate Caches → Invalidate and Restart**, then **Sync Project with Gradle Files**.

## Backend

Requires the Express API at `../../backend` on port `4000`.

- Emulator base URL: `http://10.0.2.2:4000/api/`
- Libraries: Retrofit, Picasso, Material, ViewBinding
