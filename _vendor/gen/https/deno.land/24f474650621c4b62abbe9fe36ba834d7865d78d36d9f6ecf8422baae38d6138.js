/**
 * This module contains typing definitions.
 * @module
 */ /** XML symbol */ export const $XML = Symbol("x/xml");
/** Schema */ export const schema = {
  comment: "#comment",
  text: "#text",
  stylesheets: "$stylesheets",
  attribute: {
    prefix: "@"
  },
  property: {
    prefix: "@"
  },
  space: {
    name: "xml:space",
    preserve: "preserve"
  }
};
/** Seek mode */ export const SeekMode = Object.freeze({
  Start: 0,
  Current: 1,
  End: 2
});
/** Entities */ export const entities = {
  xml: {
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&quot;": '"',
    "&amp;": "&"
  },
  char: {
    "&": "&amp;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;"
  }
};
/** Tokens */ export const tokens = {
  entity: {
    regex: {
      entities: /&#(?<hex>x?)(?<code>\d+);/g
    }
  },
  prolog: {
    start: "<?xml",
    end: "?>"
  },
  stylesheet: {
    start: "<?xml-stylesheet",
    end: "?>"
  },
  doctype: {
    start: "<!DOCTYPE",
    end: ">",
    elements: {
      start: "[",
      end: "]"
    },
    element: {
      start: "<!ELEMENT",
      end: ">",
      value: {
        start: "(",
        end: ")",
        regex: {
          end: {
            until: /\)/,
            bytes: 1
          }
        }
      }
    }
  },
  comment: {
    start: "<!--",
    end: "-->",
    regex: {
      end: {
        until: /(?<!-)-->/,
        bytes: 4,
        length: 3
      }
    }
  },
  cdata: {
    start: "<![CDATA[",
    end: "]]>",
    regex: {
      end: {
        until: /\]\]>/,
        bytes: 3
      }
    }
  },
  tag: {
    start: "<",
    end: ">",
    close: {
      start: "</",
      end: ">",
      self: "/",
      regex: {
        start: /<\//,
        end: /\/?>/
      }
    },
    attribute: {
      regex: {
        name: {
          until: /=/,
          bytes: 1
        }
      }
    },
    regex: {
      name: {
        until: /[\s\/>]/,
        bytes: 1
      },
      start: {
        until: /</,
        bytes: 1
      }
    }
  },
  text: {
    regex: {
      end: {
        until: /(<\/)|(<!)/,
        bytes: 2
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gveG1sQDQuMC4wL3V0aWxzL3R5cGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBtb2R1bGUgY29udGFpbnMgdHlwaW5nIGRlZmluaXRpb25zLlxuICogQG1vZHVsZVxuICovXG5cbi8qKiBYTUwgc3ltYm9sICovXG5leHBvcnQgY29uc3QgJFhNTDogdW5pcXVlIHN5bWJvbCA9IFN5bWJvbChcIngveG1sXCIpXG5cbi8qKlxuICogRmx1eFxuICoge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9pby90eXBlcy50c31cbiAqL1xuZXhwb3J0IHR5cGUgRmx1eCA9IHtcbiAgcmVhZFN5bmMocDogVWludDhBcnJheSk6IG51bWJlciB8IG51bGxcbn0gJiBEZW5vLlNlZWtlclN5bmNcblxuLyoqIFBhcnNlciBvcHRpb25zICovXG5leHBvcnQgdHlwZSBQYXJzZXJPcHRpb25zID0ge1xuICByZXZpdmVCb29sZWFucz86IGJvb2xlYW5cbiAgcmV2aXZlTnVtYmVycz86IGJvb2xlYW5cbiAgZW1wdHlUb051bGw/OiBib29sZWFuXG4gIGRlYnVnPzogYm9vbGVhblxuICBmbGF0dGVuPzogYm9vbGVhblxuICBwcm9ncmVzcz86IChieXRlczogbnVtYmVyKSA9PiB2b2lkXG4gIHJldml2ZXI/OiAoXG4gICAgdGhpczogbm9kZSxcbiAgICBvcHRpb25zOiB7XG4gICAgICBrZXk6IHN0cmluZ1xuICAgICAgdmFsdWU6IHVua25vd25cbiAgICAgIHRhZzogc3RyaW5nXG4gICAgICBwcm9wZXJ0aWVzOiBudWxsIHwgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH1cbiAgICB9LFxuICApID0+IHVua25vd25cbn1cblxuLyoqIFN0cmluZ2lmaWVyIG9wdGlvbnMgKi9cbmV4cG9ydCB0eXBlIFN0cmluZ2lmaWVyT3B0aW9ucyA9IHtcbiAgaW5kZW50U2l6ZT86IG51bWJlclxuICBudWxsVG9FbXB0eT86IGJvb2xlYW5cbiAgZXNjYXBlQWxsRW50aXRpZXM/OiBib29sZWFuXG4gIGRlYnVnPzogYm9vbGVhblxuICBwcm9ncmVzcz86IChieXRlczogbnVtYmVyKSA9PiB2b2lkXG4gIHJlcGxhY2VyPzogKFxuICAgIHRoaXM6IG51bGwsXG4gICAgb3B0aW9uczoge1xuICAgICAga2V5OiBzdHJpbmdcbiAgICAgIHZhbHVlOiB1bmtub3duXG4gICAgICB0YWc6IHN0cmluZ1xuICAgICAgcHJvcGVydGllczogbnVsbCB8IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9XG4gICAgfSxcbiAgKSA9PiB1bmtub3duXG59XG5cbi8qKiBTdHJpbmdpZmllciBleHRyYWN0ICovXG5leHBvcnQgdHlwZSBleHRyYWN0ID0ge1xuICByYXc6IG5vZGVcbiAgdGV4dDogc3RyaW5nIHwgbnVsbFxuICBjb21tZW50czogc3RyaW5nW11cbiAgYXR0cmlidXRlczogc3RyaW5nW11cbiAgY2hpbGRyZW46IHN0cmluZ1tdXG4gIG1ldGE6IG1ldGFcbn1cblxuLyoqIFhNTCBtZXRhICovXG5leHBvcnQgdHlwZSBtZXRhID0geyBuYW1lOiBzdHJpbmc7IHBhcmVudDogbnVsbCB8IG5vZGU7IGNkYXRhPzogQXJyYXk8c3RyaW5nW10+IH1cblxuLyoqIE5vZGUgdHlwZSAqL1xuZXhwb3J0IHR5cGUgbm9kZSA9IHtcbiAgWyRYTUxdOiBtZXRhXG4gIFtrZXk6IFByb3BlcnR5S2V5XTogdW5rbm93blxufVxuXG4vKiogRG9jdW1lbnQgdHlwZSAqL1xuZXhwb3J0IHR5cGUgZG9jdW1lbnQgPSB7XG4gIHhtbD86IG5vZGVcbiAgZG9jdHlwZT86IG5vZGVcbiAgW2tleTogUHJvcGVydHlLZXldOiBub2RlIHwgbGl0ZXJhbFxufVxuXG4vKiogTm9kZSB0eXBlICh1c2VyKSAqL1xuZXhwb3J0IHR5cGUgdW5vZGUgPSB7XG4gIFskWE1MXT86IG1ldGFcbiAgW2tleTogUHJvcGVydHlLZXldOiB1bmtub3duXG59XG5cbi8qKiBEb2N1bWVudCB0eXBlICh1c2VyKSAqL1xuZXhwb3J0IHR5cGUgdWRvY3VtZW50ID0ge1xuICB4bWw/OiB1bm9kZVxuICBkb2N0eXBlPzogdW5vZGVcbiAgW2tleTogUHJvcGVydHlLZXldOiB1bm9kZSB8IGxpdGVyYWxcbn1cblxuLyoqIExpdGVyYWwgdHlwZSAqL1xuZXhwb3J0IHR5cGUgbGl0ZXJhbCA9IHN0cmluZyB8IGJvb2xlYW4gfCBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkXG5cbi8qKiBTY2hlbWEgKi9cbmV4cG9ydCBjb25zdCBzY2hlbWEgPSB7XG4gIGNvbW1lbnQ6IFwiI2NvbW1lbnRcIixcbiAgdGV4dDogXCIjdGV4dFwiLFxuICBzdHlsZXNoZWV0czogXCIkc3R5bGVzaGVldHNcIixcbiAgYXR0cmlidXRlOiB7XG4gICAgcHJlZml4OiBcIkBcIixcbiAgfSxcbiAgcHJvcGVydHk6IHtcbiAgICBwcmVmaXg6IFwiQFwiLFxuICB9LFxuICBzcGFjZToge1xuICAgIG5hbWU6IFwieG1sOnNwYWNlXCIsXG4gICAgcHJlc2VydmU6IFwicHJlc2VydmVcIixcbiAgfSxcbn0gYXMgY29uc3RcblxuLyoqIFNlZWsgbW9kZSAqL1xuZXhwb3J0IGNvbnN0IFNlZWtNb2RlID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFN0YXJ0OiAwLFxuICBDdXJyZW50OiAxLFxuICBFbmQ6IDIsXG59KSBhcyB7XG4gIFN0YXJ0OiBEZW5vLlNlZWtNb2RlLlN0YXJ0XG4gIEN1cnJlbnQ6IERlbm8uU2Vla01vZGUuQ3VycmVudFxuICBFbmQ6IERlbm8uU2Vla01vZGUuRW5kXG59XG5cbi8qKiBFbnRpdGllcyAqL1xuZXhwb3J0IGNvbnN0IGVudGl0aWVzID0ge1xuICB4bWw6IHtcbiAgICBcIiZsdDtcIjogXCI8XCIsXG4gICAgXCImZ3Q7XCI6IFwiPlwiLFxuICAgIFwiJmFwb3M7XCI6IFwiJ1wiLFxuICAgIFwiJnF1b3Q7XCI6ICdcIicsXG4gICAgXCImYW1wO1wiOiBcIiZcIiwgLy9LZWVwIGxhc3RcbiAgfSxcbiAgY2hhcjoge1xuICAgIFwiJlwiOiBcIiZhbXA7XCIsIC8vS2VlcCBmaXJzdFxuICAgICdcIic6IFwiJnF1b3Q7XCIsXG4gICAgXCI8XCI6IFwiJmx0O1wiLFxuICAgIFwiPlwiOiBcIiZndDtcIixcbiAgICBcIidcIjogXCImYXBvcztcIixcbiAgfSxcbn0gYXMgY29uc3RcblxuLyoqIFRva2VucyAqL1xuZXhwb3J0IGNvbnN0IHRva2VucyA9IHtcbiAgZW50aXR5OiB7XG4gICAgcmVnZXg6IHtcbiAgICAgIGVudGl0aWVzOiAvJiMoPzxoZXg+eD8pKD88Y29kZT5cXGQrKTsvZyxcbiAgICB9LFxuICB9LFxuICBwcm9sb2c6IHtcbiAgICBzdGFydDogXCI8P3htbFwiLFxuICAgIGVuZDogXCI/PlwiLFxuICB9LFxuICBzdHlsZXNoZWV0OiB7XG4gICAgc3RhcnQ6IFwiPD94bWwtc3R5bGVzaGVldFwiLFxuICAgIGVuZDogXCI/PlwiLFxuICB9LFxuICBkb2N0eXBlOiB7XG4gICAgc3RhcnQ6IFwiPCFET0NUWVBFXCIsXG4gICAgZW5kOiBcIj5cIixcbiAgICBlbGVtZW50czoge1xuICAgICAgc3RhcnQ6IFwiW1wiLFxuICAgICAgZW5kOiBcIl1cIixcbiAgICB9LFxuICAgIGVsZW1lbnQ6IHtcbiAgICAgIHN0YXJ0OiBcIjwhRUxFTUVOVFwiLFxuICAgICAgZW5kOiBcIj5cIixcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIHN0YXJ0OiBcIihcIixcbiAgICAgICAgZW5kOiBcIilcIixcbiAgICAgICAgcmVnZXg6IHtcbiAgICAgICAgICBlbmQ6IHsgdW50aWw6IC9cXCkvLCBieXRlczogMSB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBjb21tZW50OiB7XG4gICAgc3RhcnQ6IFwiPCEtLVwiLFxuICAgIGVuZDogXCItLT5cIixcbiAgICByZWdleDoge1xuICAgICAgZW5kOiB7IHVudGlsOiAvKD88IS0pLS0+LywgYnl0ZXM6IDQsIGxlbmd0aDogMyB9LFxuICAgIH0sXG4gIH0sXG4gIGNkYXRhOiB7XG4gICAgc3RhcnQ6IFwiPCFbQ0RBVEFbXCIsXG4gICAgZW5kOiBcIl1dPlwiLFxuICAgIHJlZ2V4OiB7XG4gICAgICBlbmQ6IHtcbiAgICAgICAgdW50aWw6IC9cXF1cXF0+LyxcbiAgICAgICAgYnl0ZXM6IDMsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHRhZzoge1xuICAgIHN0YXJ0OiBcIjxcIixcbiAgICBlbmQ6IFwiPlwiLFxuICAgIGNsb3NlOiB7XG4gICAgICBzdGFydDogXCI8L1wiLFxuICAgICAgZW5kOiBcIj5cIixcbiAgICAgIHNlbGY6IFwiL1wiLFxuICAgICAgcmVnZXg6IHtcbiAgICAgICAgc3RhcnQ6IC88XFwvLyxcbiAgICAgICAgZW5kOiAvXFwvPz4vLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGF0dHJpYnV0ZToge1xuICAgICAgcmVnZXg6IHtcbiAgICAgICAgbmFtZTogeyB1bnRpbDogLz0vLCBieXRlczogMSB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlZ2V4OiB7XG4gICAgICBuYW1lOiB7IHVudGlsOiAvW1xcc1xcLz5dLywgYnl0ZXM6IDEgfSxcbiAgICAgIHN0YXJ0OiB7IHVudGlsOiAvPC8sIGJ5dGVzOiAxIH0sXG4gICAgfSxcbiAgfSxcbiAgdGV4dDoge1xuICAgIHJlZ2V4OiB7XG4gICAgICBlbmQ6IHsgdW50aWw6IC8oPFxcLyl8KDwhKS8sIGJ5dGVzOiAyIH0sXG4gICAgfSxcbiAgfSxcbn0gYXMgY29uc3RcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0NBR0MsR0FFRCxlQUFlLEdBQ2YsT0FBTyxNQUFNLE9BQXNCLE9BQU8sU0FBUTtBQXlGbEQsV0FBVyxHQUNYLE9BQU8sTUFBTSxTQUFTO0VBQ3BCLFNBQVM7RUFDVCxNQUFNO0VBQ04sYUFBYTtFQUNiLFdBQVc7SUFDVCxRQUFRO0VBQ1Y7RUFDQSxVQUFVO0lBQ1IsUUFBUTtFQUNWO0VBQ0EsT0FBTztJQUNMLE1BQU07SUFDTixVQUFVO0VBQ1o7QUFDRixFQUFVO0FBRVYsY0FBYyxHQUNkLE9BQU8sTUFBTSxXQUFXLE9BQU8sTUFBTSxDQUFDO0VBQ3BDLE9BQU87RUFDUCxTQUFTO0VBQ1QsS0FBSztBQUNQLEdBSUM7QUFFRCxhQUFhLEdBQ2IsT0FBTyxNQUFNLFdBQVc7RUFDdEIsS0FBSztJQUNILFFBQVE7SUFDUixRQUFRO0lBQ1IsVUFBVTtJQUNWLFVBQVU7SUFDVixTQUFTO0VBQ1g7RUFDQSxNQUFNO0lBQ0osS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7RUFDUDtBQUNGLEVBQVU7QUFFVixXQUFXLEdBQ1gsT0FBTyxNQUFNLFNBQVM7RUFDcEIsUUFBUTtJQUNOLE9BQU87TUFDTCxVQUFVO0lBQ1o7RUFDRjtFQUNBLFFBQVE7SUFDTixPQUFPO0lBQ1AsS0FBSztFQUNQO0VBQ0EsWUFBWTtJQUNWLE9BQU87SUFDUCxLQUFLO0VBQ1A7RUFDQSxTQUFTO0lBQ1AsT0FBTztJQUNQLEtBQUs7SUFDTCxVQUFVO01BQ1IsT0FBTztNQUNQLEtBQUs7SUFDUDtJQUNBLFNBQVM7TUFDUCxPQUFPO01BQ1AsS0FBSztNQUNMLE9BQU87UUFDTCxPQUFPO1FBQ1AsS0FBSztRQUNMLE9BQU87VUFDTCxLQUFLO1lBQUUsT0FBTztZQUFNLE9BQU87VUFBRTtRQUMvQjtNQUNGO0lBQ0Y7RUFDRjtFQUNBLFNBQVM7SUFDUCxPQUFPO0lBQ1AsS0FBSztJQUNMLE9BQU87TUFDTCxLQUFLO1FBQUUsT0FBTztRQUFhLE9BQU87UUFBRyxRQUFRO01BQUU7SUFDakQ7RUFDRjtFQUNBLE9BQU87SUFDTCxPQUFPO0lBQ1AsS0FBSztJQUNMLE9BQU87TUFDTCxLQUFLO1FBQ0gsT0FBTztRQUNQLE9BQU87TUFDVDtJQUNGO0VBQ0Y7RUFDQSxLQUFLO0lBQ0gsT0FBTztJQUNQLEtBQUs7SUFDTCxPQUFPO01BQ0wsT0FBTztNQUNQLEtBQUs7TUFDTCxNQUFNO01BQ04sT0FBTztRQUNMLE9BQU87UUFDUCxLQUFLO01BQ1A7SUFDRjtJQUNBLFdBQVc7TUFDVCxPQUFPO1FBQ0wsTUFBTTtVQUFFLE9BQU87VUFBSyxPQUFPO1FBQUU7TUFDL0I7SUFDRjtJQUNBLE9BQU87TUFDTCxNQUFNO1FBQUUsT0FBTztRQUFXLE9BQU87TUFBRTtNQUNuQyxPQUFPO1FBQUUsT0FBTztRQUFLLE9BQU87TUFBRTtJQUNoQztFQUNGO0VBQ0EsTUFBTTtJQUNKLE9BQU87TUFDTCxLQUFLO1FBQUUsT0FBTztRQUFjLE9BQU87TUFBRTtJQUN2QztFQUNGO0FBQ0YsRUFBVSJ9