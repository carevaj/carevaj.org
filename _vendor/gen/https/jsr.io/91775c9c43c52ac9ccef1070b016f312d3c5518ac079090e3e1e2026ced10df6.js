// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Use this to retrieve the numeric log level by it's associated name.
 * Defaults to INFO.
 */ export const LogLevels = {
  NOTSET: 0,
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50
};
/** Permitted log level names */ export const LogLevelNames = Object.keys(LogLevels).filter((key)=>isNaN(Number(key)));
const byLevel = {
  [LogLevels.NOTSET]: "NOTSET",
  [LogLevels.DEBUG]: "DEBUG",
  [LogLevels.INFO]: "INFO",
  [LogLevels.WARN]: "WARN",
  [LogLevels.ERROR]: "ERROR",
  [LogLevels.CRITICAL]: "CRITICAL"
};
/**
 * Returns the numeric log level associated with the passed,
 * stringy log level name.
 */ export function getLevelByName(name) {
  const level = LogLevels[name];
  if (level !== undefined) {
    return level;
  }
  throw new Error(`no log level found for name: ${name}`);
}
/** Returns the stringy log level name provided the numeric log level. */ export function getLevelName(level) {
  const levelName = byLevel[level];
  if (levelName) {
    return levelName;
  }
  throw new Error(`no level name found for level: ${level}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvbG9nLzAuMjI0LjEvbGV2ZWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogVXNlIHRoaXMgdG8gcmV0cmlldmUgdGhlIG51bWVyaWMgbG9nIGxldmVsIGJ5IGl0J3MgYXNzb2NpYXRlZCBuYW1lLlxuICogRGVmYXVsdHMgdG8gSU5GTy5cbiAqL1xuZXhwb3J0IGNvbnN0IExvZ0xldmVscyA9IHtcbiAgTk9UU0VUOiAwLFxuICBERUJVRzogMTAsXG4gIElORk86IDIwLFxuICBXQVJOOiAzMCxcbiAgRVJST1I6IDQwLFxuICBDUklUSUNBTDogNTAsXG59IGFzIGNvbnN0O1xuXG4vKiogVW5pb24gb2YgdmFsaWQgbG9nIGxldmVscyAqL1xuZXhwb3J0IHR5cGUgTG9nTGV2ZWwgPSB0eXBlb2YgTG9nTGV2ZWxzW0xldmVsTmFtZV07XG5cbi8qKiBVbmlvbiBvZiB2YWxpZCBsb2cgbGV2ZWwgbmFtZXMgKi9cbmV4cG9ydCB0eXBlIExldmVsTmFtZSA9IEV4Y2x1ZGU8a2V5b2YgdHlwZW9mIExvZ0xldmVscywgbnVtYmVyPjtcblxuLyoqIFBlcm1pdHRlZCBsb2cgbGV2ZWwgbmFtZXMgKi9cbmV4cG9ydCBjb25zdCBMb2dMZXZlbE5hbWVzOiBMZXZlbE5hbWVbXSA9IE9iamVjdC5rZXlzKExvZ0xldmVscykuZmlsdGVyKChrZXkpID0+XG4gIGlzTmFOKE51bWJlcihrZXkpKVxuKSBhcyBMZXZlbE5hbWVbXTtcblxuY29uc3QgYnlMZXZlbDogUmVjb3JkPExvZ0xldmVsLCBMZXZlbE5hbWU+ID0ge1xuICBbTG9nTGV2ZWxzLk5PVFNFVF06IFwiTk9UU0VUXCIsXG4gIFtMb2dMZXZlbHMuREVCVUddOiBcIkRFQlVHXCIsXG4gIFtMb2dMZXZlbHMuSU5GT106IFwiSU5GT1wiLFxuICBbTG9nTGV2ZWxzLldBUk5dOiBcIldBUk5cIixcbiAgW0xvZ0xldmVscy5FUlJPUl06IFwiRVJST1JcIixcbiAgW0xvZ0xldmVscy5DUklUSUNBTF06IFwiQ1JJVElDQUxcIixcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbnVtZXJpYyBsb2cgbGV2ZWwgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQsXG4gKiBzdHJpbmd5IGxvZyBsZXZlbCBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGV2ZWxCeU5hbWUobmFtZTogTGV2ZWxOYW1lKTogTG9nTGV2ZWwge1xuICBjb25zdCBsZXZlbCA9IExvZ0xldmVsc1tuYW1lXTtcbiAgaWYgKGxldmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbGV2ZWw7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBubyBsb2cgbGV2ZWwgZm91bmQgZm9yIG5hbWU6ICR7bmFtZX1gKTtcbn1cblxuLyoqIFJldHVybnMgdGhlIHN0cmluZ3kgbG9nIGxldmVsIG5hbWUgcHJvdmlkZWQgdGhlIG51bWVyaWMgbG9nIGxldmVsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExldmVsTmFtZShsZXZlbDogTG9nTGV2ZWwpOiBMZXZlbE5hbWUge1xuICBjb25zdCBsZXZlbE5hbWUgPSBieUxldmVsW2xldmVsIGFzIExvZ0xldmVsXTtcbiAgaWYgKGxldmVsTmFtZSkge1xuICAgIHJldHVybiBsZXZlbE5hbWU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBubyBsZXZlbCBuYW1lIGZvdW5kIGZvciBsZXZlbDogJHtsZXZlbH1gKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Q0FHQyxHQUNELE9BQU8sTUFBTSxZQUFZO0VBQ3ZCLFFBQVE7RUFDUixPQUFPO0VBQ1AsTUFBTTtFQUNOLE1BQU07RUFDTixPQUFPO0VBQ1AsVUFBVTtBQUNaLEVBQVc7QUFRWCw4QkFBOEIsR0FDOUIsT0FBTyxNQUFNLGdCQUE2QixPQUFPLElBQUksQ0FBQyxXQUFXLE1BQU0sQ0FBQyxDQUFDLE1BQ3ZFLE1BQU0sT0FBTyxPQUNFO0FBRWpCLE1BQU0sVUFBdUM7RUFDM0MsQ0FBQyxVQUFVLE1BQU0sQ0FBQyxFQUFFO0VBQ3BCLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtFQUNuQixDQUFDLFVBQVUsSUFBSSxDQUFDLEVBQUU7RUFDbEIsQ0FBQyxVQUFVLElBQUksQ0FBQyxFQUFFO0VBQ2xCLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtFQUNuQixDQUFDLFVBQVUsUUFBUSxDQUFDLEVBQUU7QUFDeEI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsZUFBZSxJQUFlO0VBQzVDLE1BQU0sUUFBUSxTQUFTLENBQUMsS0FBSztFQUM3QixJQUFJLFVBQVUsV0FBVztJQUN2QixPQUFPO0VBQ1Q7RUFDQSxNQUFNLElBQUksTUFBTSxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQztBQUN4RDtBQUVBLHVFQUF1RSxHQUN2RSxPQUFPLFNBQVMsYUFBYSxLQUFlO0VBQzFDLE1BQU0sWUFBWSxPQUFPLENBQUMsTUFBa0I7RUFDNUMsSUFBSSxXQUFXO0lBQ2IsT0FBTztFQUNUO0VBQ0EsTUFBTSxJQUFJLE1BQU0sQ0FBQywrQkFBK0IsRUFBRSxNQUFNLENBQUM7QUFDM0QifQ==