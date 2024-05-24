//Imports
import { $XML, entities, schema, tokens } from "./types.ts";
/**
 * XML parser helper
 */ export class Parser {
  /** Constructor */ constructor(stream, options = {}){
    this.#stream = stream;
    this.#options = options;
    this.#options.reviver ??= function({ value }) {
      return value;
    };
  }
  /** Parse document */ parse() {
    return this.#document();
  }
  /** Options */ #options;
  /** Debugger */ #debug(path, string) {
    if (this.#options.debug) {
      console.debug(`${path.map((node)=>node[$XML].name).join(" > ")} | ${string}`.trim());
    }
  }
  /** Document parser */ #document() {
    const document = Object.defineProperty({}, $XML, {
      enumerable: false,
      writable: true,
      value: {
        cdata: []
      }
    });
    const path = [];
    const comments = [];
    let root = false;
    let clean;
    this.#trim();
    //Parse document
    try {
      while(true){
        clean = true;
        //Comments
        if (this.#peek(tokens.comment.start)) {
          clean = false;
          comments.push(this.#comment({
            path
          }));
          continue;
        } else if (this.#peek(tokens.prolog.start) && !this.#peek(tokens.stylesheet.start)) {
          if (document.xml) {
            throw Object.assign(new SyntaxError("Multiple prolog declaration found"), {
              stack: false
            });
          }
          clean = false;
          Object.assign(document, this.#prolog({
            path
          }));
          continue;
        } else if (this.#peek(tokens.stylesheet.start)) {
          clean = false;
          const stylesheets = document[schema.stylesheets] ??= [];
          stylesheets.push(this.#stylesheet({
            path
          }).stylesheet);
          continue;
        } else if (this.#peek(tokens.doctype.start)) {
          if (document.doctype) {
            throw Object.assign(new SyntaxError("Multiple doctype declaration found"), {
              stack: false
            });
          }
          clean = false;
          Object.assign(document, this.#doctype({
            path
          }));
          continue;
        } else if (this.#peek(tokens.tag.start)) {
          if (root) {
            throw Object.assign(new SyntaxError("Multiple root elements found"), {
              stack: false
            });
          }
          clean = false;
          Object.assign(document, this.#node({
            document,
            path
          }));
          this.#trim();
          root = true;
          continue;
        } else {
          throw Object.assign(new SyntaxError("Invalid XML structure"), {
            stack: false
          });
        }
      }
    } catch (error) {
      if (error instanceof RangeError && clean) {
        if (comments.length) {
          document[schema.comment] = comments;
        }
        return document;
      }
      throw error;
    }
  }
  /** Node parser */ #node({ document, path }) {
    if (this.#options.progress) {
      this.#options.progress(this.#stream.cursor);
    }
    if (this.#peek(tokens.comment.start)) {
      return {
        [schema.comment]: this.#comment({
          path
        })
      };
    }
    return this.#tag({
      document,
      path
    });
  }
  /** Prolog parser */ #prolog({ path }) {
    this.#debug(path, "parsing prolog");
    const prolog = this.#make.node({
      name: "xml",
      path
    });
    this.#consume(tokens.prolog.start);
    //Tag attributes
    while(!this.#peek(tokens.prolog.end)){
      // https://www.w3.org/TR/REC-xml/#NT-VersionNum
      Object.assign(prolog, this.#attribute({
        path: [
          ...path,
          prolog
        ],
        raw: [
          "version"
        ]
      }));
    }
    //Result
    this.#consume(tokens.prolog.end);
    return {
      xml: prolog
    };
  }
  /** Stylesheet parser */ #stylesheet({ path }) {
    this.#debug(path, "parsing stylesheet");
    const stylesheet = this.#make.node({
      name: "xml-stylesheet",
      path
    });
    this.#consume(tokens.stylesheet.start);
    //Tag attributes
    while(!this.#peek(tokens.stylesheet.end)){
      Object.assign(stylesheet, this.#attribute({
        path: [
          ...path,
          stylesheet
        ]
      }));
    }
    //Result
    this.#consume(tokens.stylesheet.end);
    return {
      stylesheet
    };
  }
  /** Doctype parser */ #doctype({ path }) {
    this.#debug(path, "parsing doctype");
    const doctype = this.#make.node({
      name: "doctype",
      path
    });
    Object.defineProperty(doctype, $XML, {
      enumerable: false,
      writable: true
    });
    this.#consume(tokens.doctype.start);
    //Tag attributes
    while(!this.#peek(tokens.doctype.end)){
      if (this.#peek(tokens.doctype.elements.start)) {
        this.#consume(tokens.doctype.elements.start);
        while(!this.#peek(tokens.doctype.elements.end)){
          Object.assign(doctype, this.#doctypeElement({
            path
          }));
        }
        this.#consume(tokens.doctype.elements.end);
      } else {
        Object.assign(doctype, this.#property({
          path
        }));
      }
    }
    //Result
    this.#stream.consume({
      content: tokens.doctype.end
    });
    return {
      doctype
    };
  }
  /** Doctype element parser */ #doctypeElement({ path }) {
    this.#debug(path, "parsing doctype element");
    //Element name
    this.#consume(tokens.doctype.element.start);
    const element = Object.keys(this.#property({
      path
    })).shift().substring(schema.property.prefix.length);
    this.#debug(path, `found doctype element "${element}"`);
    //Element value
    this.#consume(tokens.doctype.element.value.start);
    const value = this.#capture(tokens.doctype.element.value.regex.end);
    this.#consume(tokens.doctype.element.value.end);
    this.#debug(path, `found doctype element value "${value}"`);
    //Result
    this.#consume(tokens.doctype.element.end);
    return {
      [element]: value
    };
  }
  /** Tag parser */ #tag({ document, path }) {
    this.#debug(path, "parsing tag");
    const tag = this.#make.node({
      path
    });
    //Tag name
    this.#consume(tokens.tag.start);
    const name = this.#capture(tokens.tag.regex.name);
    Object.assign(tag[$XML], {
      name
    });
    this.#debug(path, `found tag "${name}"`);
    //Tag attributes
    while(!tokens.tag.close.regex.end.test(this.#stream.peek(2))){
      Object.assign(tag, this.#attribute({
        path: [
          ...path,
          tag
        ]
      }));
    }
    //Honor xml:space directive
    let trim = true;
    if (tag[`${schema.attribute.prefix}${schema.space.name}`] === schema.space.preserve) {
      this.#debug([
        ...path,
        tag
      ], `${schema.space.name} is set to ${schema.space.preserve}`);
      trim = false;
    }
    //Self-closed tag
    const selfclosed = this.#peek(tokens.tag.close.self);
    if (selfclosed) {
      this.#debug(path, `tag "${name}" is self-closed`);
      this.#consume(tokens.tag.close.self);
    }
    this.#consume(tokens.tag.end, {
      trim
    });
    //Pair-closed tag
    if (!selfclosed) {
      //Text node
      if (this.#peek(tokens.cdata.start) || !this.#peek(tokens.tag.start)) {
        Object.assign(tag, this.#text({
          document,
          close: name,
          path: [
            ...path,
            tag
          ],
          trim
        }));
      } else {
        while(!tokens.tag.close.regex.start.test(this.#stream.peek(2))){
          const child = this.#node({
            document,
            path: [
              ...path,
              tag
            ]
          });
          const [key, value] = Object.entries(child).shift();
          if (Array.isArray(tag[key])) {
            tag[key].push(value);
            this.#debug([
              ...path,
              tag
            ], `add new child "${key}" to array`);
          } else if (key in tag) {
            const array = [
              tag[key],
              value
            ];
            Object.defineProperty(array, $XML, {
              enumerable: false,
              writable: true
            });
            if (tag[key]?.[$XML]) {
              Object.assign(array, {
                [$XML]: tag[key][$XML]
              });
            }
            tag[key] = array;
            this.#debug([
              ...path,
              tag
            ], `multiple children named "${key}", using array notation`);
          } else {
            Object.assign(tag, child);
            this.#debug([
              ...path,
              tag
            ], `add new child "${key}"`);
          }
        }
      }
      //Closing tag
      this.#consume(tokens.tag.close.start);
      this.#consume(name);
      this.#consume(tokens.tag.close.end);
      this.#debug(path, `found closing tag for "${name}"`);
    }
    //Result
    for (const [key] of Object.entries(tag).filter(([_, value])=>typeof value === "undefined")){
      delete tag[key];
    }
    if (!Object.keys(tag).includes(schema.text)) {
      const children = Object.keys(tag).filter((key)=>!key.startsWith(schema.attribute.prefix) && key !== schema.text);
      if (!children.length) {
        this.#debug(path, `tag "${name}" has implictely obtained a text node as it has no children but has attributes`);
        tag[schema.text] = this.#revive({
          key: schema.text,
          value: "",
          tag
        });
      }
    }
    if ((this.#options.flatten ?? true) && Object.keys(tag).includes(schema.text) && Object.keys(tag).length === 1) {
      this.#debug(path, `tag "${name}" has been implicitely flattened as it only has a text node`);
      return {
        [name]: tag[schema.text]
      };
    }
    return {
      [name]: tag
    };
  }
  /** Attribute parser */ #attribute({ path, raw = [] }) {
    this.#debug(path, "parsing attribute");
    //Attribute name
    const attribute = this.#capture(tokens.tag.attribute.regex.name);
    this.#debug(path, `found attribute "${attribute}"`);
    //Attribute value
    this.#consume("=");
    const quote = this.#stream.peek();
    this.#consume(quote);
    const value = this.#capture({
      until: new RegExp(quote),
      bytes: quote.length
    });
    this.#consume(quote);
    this.#debug(path, `found attribute value "${value}"`);
    //Result
    return {
      [`${schema.attribute.prefix}${attribute}`]: raw.includes(attribute) ? value : this.#revive({
        key: `${schema.attribute.prefix}${attribute}`,
        value,
        tag: path.at(-1)
      })
    };
  }
  /** Property parser */ #property({ path }) {
    this.#debug(path, "parsing property");
    //Property name
    let property;
    const quote = this.#stream.peek();
    if (/["']/.test(quote)) {
      this.#consume(quote);
      property = this.#capture({
        until: new RegExp(quote),
        bytes: 1
      });
      this.#consume(quote);
    } else {
      property = this.#capture({
        until: /[\s>]/,
        bytes: 1
      });
    }
    this.#debug(path, `found property ${property}`);
    //Result
    return {
      [`${schema.property.prefix}${property}`]: true
    };
  }
  /** Text parser */ #text({ document, close, path, trim }) {
    this.#debug(path, "parsing text");
    const tag = this.#make.node({
      name: schema.text,
      path
    });
    let text = "";
    const comments = [];
    //Content
    while(this.#peek(tokens.cdata.start) || !this.#peeks([
      tokens.tag.close.start,
      close,
      tokens.tag.close.end
    ])){
      //CDATA
      if (this.#peek(tokens.cdata.start)) {
        const cpath = path.map((node)=>node[$XML].name);
        document[$XML].cdata?.push(cpath);
        this.#debug(path, `text is specified as cdata, storing path >${cpath.join(">")} in document metadata`);
        text += this.#cdata({
          path: [
            ...path,
            tag
          ]
        });
      } else if (this.#peek(tokens.comment.start)) {
        comments.push(this.#comment({
          path: [
            ...path,
            tag
          ]
        }));
      } else {
        text += this.#capture({
          ...tokens.text.regex.end
        }, {
          trim
        });
        if (this.#peek(tokens.cdata.start) || this.#peek(tokens.comment.start)) {
          continue;
        }
        if (!this.#peeks([
          tokens.tag.close.start,
          close,
          tokens.tag.close.end
        ])) {
          text += tokens.tag.close.start;
          this.#consume(tokens.tag.close.start);
        }
      }
    }
    this.#debug(path, `parsed text "${text}"`);
    if (comments.length) {
      this.#debug(path, `parsed comments ${JSON.stringify(comments)}`);
    }
    //Result
    Object.assign(tag, {
      [schema.text]: this.#revive({
        key: schema.text,
        value: trim ? text.trim() : text,
        tag: path.at(-1)
      }),
      ...comments.length ? {
        [schema.comment]: comments
      } : {}
    });
    return tag;
  }
  /** CDATA parser */ #cdata({ path }) {
    this.#debug(path, "parsing cdata");
    this.#consume(tokens.cdata.start);
    const data = this.#capture(tokens.cdata.regex.end);
    this.#consume(tokens.cdata.end);
    return data;
  }
  /** Comment parser */ #comment({ path }) {
    this.#debug(path, "parsing comment");
    this.#consume(tokens.comment.start);
    const comment = this.#capture(tokens.comment.regex.end).trim();
    this.#consume(tokens.comment.end);
    return comment;
  }
  //================================================================================
  /** Reviver */ #revive({ key, value, tag }) {
    return this.#options.reviver.call(tag, {
      key,
      tag: tag[$XML].name,
      properties: !(key.startsWith(schema.attribute.prefix) || key.startsWith(schema.property.prefix)) ? {
        ...tag
      } : null,
      value: (()=>{
        switch(true){
          //Convert empty values to null
          case (this.#options.emptyToNull ?? true) && /^\s*$/.test(value):
            return null;
          //Revive booleans
          case this.#options.reviveBooleans && /^(?:true|false)$/i.test(value):
            return /^true$/i.test(value);
          //Revive numbers
          case this.#options.reviveNumbers:
            {
              const num = Number(value);
              if (Number.isFinite(num)) {
                return num;
              }
            }
          /* falls through */ //Strings
          default:
            //Unescape XML entities
            value = value.replace(tokens.entity.regex.entities, (_, hex, code)=>String.fromCharCode(parseInt(code, hex ? 16 : 10)));
            for (const [entity, character] of Object.entries(entities.xml)){
              value = value.replaceAll(entity, character);
            }
            return value;
        }
      })()
    });
  }
  //================================================================================
  /** Makers */ #make = {
    /** Node maker */ node ({ name = "", path = [] }) {
      const node = {
        [$XML]: {
          name,
          parent: path[path.length - 1] ?? null
        }
      };
      Object.defineProperty(node, $XML, {
        enumerable: false,
        writable: true
      });
      return node;
    }
  };
  //================================================================================
  /** Text stream */ #stream;
  /** Peek and validate against token */ #peek(token) {
    return this.#stream.peek(token.length) === token;
  }
  /** Peek and validate against tokens */ #peeks(tokens) {
    let offset = 0;
    for(let i = 0; i < tokens.length; i++){
      const token = tokens[i];
      while(true){
        //Ignore whitespaces
        if (/\s/.test(this.#stream.peek(1, offset))) {
          offset++;
          continue;
        }
        //Validate token
        if (this.#stream.peek(token.length, offset) === token) {
          offset += token.length;
          break;
        }
        return false;
      }
    }
    return true;
  }
  /** Consume token */ #consume(token, { trim } = {}) {
    return this.#stream.consume({
      content: token,
      trim
    });
  }
  /** Capture until next token */ #capture(token, { trim } = {}) {
    return this.#stream.capture({
      ...token,
      trim
    });
  }
  /** Trim stream */ #trim() {
    return this.#stream.trim();
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gveG1sQDQuMC4wL3V0aWxzL3BhcnNlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvL0ltcG9ydHNcbmltcG9ydCB0eXBlIHsgU3RyZWFtIH0gZnJvbSBcIi4vc3RyZWFtLnRzXCJcbmltcG9ydCB7ICRYTUwsIGVudGl0aWVzLCBzY2hlbWEsIHRva2VucyB9IGZyb20gXCIuL3R5cGVzLnRzXCJcbmltcG9ydCB0eXBlIHsgbm9kZSwgUGFyc2VyT3B0aW9ucyB9IGZyb20gXCIuL3R5cGVzLnRzXCJcblxuLyoqXG4gKiBYTUwgcGFyc2VyIGhlbHBlclxuICovXG5leHBvcnQgY2xhc3MgUGFyc2VyIHtcbiAgLyoqIENvbnN0cnVjdG9yICovXG4gIGNvbnN0cnVjdG9yKHN0cmVhbTogU3RyZWFtLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zID0ge30pIHtcbiAgICB0aGlzLiNzdHJlYW0gPSBzdHJlYW1cbiAgICB0aGlzLiNvcHRpb25zID0gb3B0aW9uc1xuICAgIHRoaXMuI29wdGlvbnMucmV2aXZlciA/Pz0gZnVuY3Rpb24gKHsgdmFsdWUgfSkge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICB9XG5cbiAgLyoqIFBhcnNlIGRvY3VtZW50ICovXG4gIHBhcnNlKCkge1xuICAgIHJldHVybiB0aGlzLiNkb2N1bWVudCgpXG4gIH1cblxuICAvKiogT3B0aW9ucyAqL1xuICByZWFkb25seSAjb3B0aW9uczogUGFyc2VyT3B0aW9uc1xuXG4gIC8qKiBEZWJ1Z2dlciAqL1xuICAjZGVidWcocGF0aDogbm9kZVtdLCBzdHJpbmc6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiNvcHRpb25zLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmRlYnVnKGAke3BhdGgubWFwKChub2RlKSA9PiBub2RlWyRYTUxdLm5hbWUpLmpvaW4oXCIgPiBcIil9IHwgJHtzdHJpbmd9YC50cmltKCkpXG4gICAgfVxuICB9XG5cbiAgLyoqIERvY3VtZW50IHBhcnNlciAqL1xuICAjZG9jdW1lbnQoKSB7XG4gICAgY29uc3QgZG9jdW1lbnQgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30gYXMgbm9kZSwgJFhNTCwge1xuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiB7IGNkYXRhOiBbXSBhcyBBcnJheTxzdHJpbmdbXT4gfSxcbiAgICB9KVxuICAgIGNvbnN0IHBhdGggPSBbXSBhcyBub2RlW11cbiAgICBjb25zdCBjb21tZW50cyA9IFtdXG4gICAgbGV0IHJvb3QgPSBmYWxzZVxuICAgIGxldCBjbGVhblxuICAgIHRoaXMuI3RyaW0oKVxuXG4gICAgLy9QYXJzZSBkb2N1bWVudFxuICAgIHRyeSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBjbGVhbiA9IHRydWVcblxuICAgICAgICAvL0NvbW1lbnRzXG4gICAgICAgIGlmICh0aGlzLiNwZWVrKHRva2Vucy5jb21tZW50LnN0YXJ0KSkge1xuICAgICAgICAgIGNsZWFuID0gZmFsc2VcbiAgICAgICAgICBjb21tZW50cy5wdXNoKHRoaXMuI2NvbW1lbnQoeyBwYXRoIH0pKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gLy9FeHRyYWN0IHByb2xvZywgc3R5bGVzaGVldHMgYW5kIGRvY3R5cGVcbiAgICAgICAgZWxzZSBpZiAoKHRoaXMuI3BlZWsodG9rZW5zLnByb2xvZy5zdGFydCkpICYmICghdGhpcy4jcGVlayh0b2tlbnMuc3R5bGVzaGVldC5zdGFydCkpKSB7XG4gICAgICAgICAgaWYgKGRvY3VtZW50LnhtbCkge1xuICAgICAgICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihuZXcgU3ludGF4RXJyb3IoXCJNdWx0aXBsZSBwcm9sb2cgZGVjbGFyYXRpb24gZm91bmRcIiksIHsgc3RhY2s6IGZhbHNlIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGNsZWFuID0gZmFsc2VcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGRvY3VtZW50LCB0aGlzLiNwcm9sb2coeyBwYXRoIH0pKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy4jcGVlayh0b2tlbnMuc3R5bGVzaGVldC5zdGFydCkpIHtcbiAgICAgICAgICBjbGVhbiA9IGZhbHNlXG4gICAgICAgICAgY29uc3Qgc3R5bGVzaGVldHMgPSAoZG9jdW1lbnRbc2NoZW1hLnN0eWxlc2hlZXRzXSA/Pz0gW10pIGFzIHVua25vd25bXVxuICAgICAgICAgIHN0eWxlc2hlZXRzLnB1c2godGhpcy4jc3R5bGVzaGVldCh7IHBhdGggfSkuc3R5bGVzaGVldClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3BlZWsodG9rZW5zLmRvY3R5cGUuc3RhcnQpKSB7XG4gICAgICAgICAgaWYgKGRvY3VtZW50LmRvY3R5cGUpIHtcbiAgICAgICAgICAgIHRocm93IE9iamVjdC5hc3NpZ24obmV3IFN5bnRheEVycm9yKFwiTXVsdGlwbGUgZG9jdHlwZSBkZWNsYXJhdGlvbiBmb3VuZFwiKSwgeyBzdGFjazogZmFsc2UgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xlYW4gPSBmYWxzZVxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQsIHRoaXMuI2RvY3R5cGUoeyBwYXRoIH0pKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gLy9FeHRyYWN0IHJvb3Qgbm9kZVxuICAgICAgICBlbHNlIGlmICh0aGlzLiNwZWVrKHRva2Vucy50YWcuc3RhcnQpKSB7XG4gICAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IE9iamVjdC5hc3NpZ24obmV3IFN5bnRheEVycm9yKFwiTXVsdGlwbGUgcm9vdCBlbGVtZW50cyBmb3VuZFwiKSwgeyBzdGFjazogZmFsc2UgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xlYW4gPSBmYWxzZVxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQsIHRoaXMuI25vZGUoeyBkb2N1bWVudCwgcGF0aCB9KSlcbiAgICAgICAgICB0aGlzLiN0cmltKClcbiAgICAgICAgICByb290ID0gdHJ1ZVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihuZXcgU3ludGF4RXJyb3IoXCJJbnZhbGlkIFhNTCBzdHJ1Y3R1cmVcIiksIHsgc3RhY2s6IGZhbHNlIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKChlcnJvciBpbnN0YW5jZW9mIFJhbmdlRXJyb3IpICYmIGNsZWFuKSB7XG4gICAgICAgIGlmIChjb21tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICBkb2N1bWVudFtzY2hlbWEuY29tbWVudF0gPSBjb21tZW50c1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkb2N1bWVudFxuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3JcbiAgICB9XG4gIH1cblxuICAvKiogTm9kZSBwYXJzZXIgKi9cbiAgI25vZGUoeyBkb2N1bWVudCwgcGF0aCB9OiB7IGRvY3VtZW50OiBub2RlOyBwYXRoOiBub2RlW10gfSkge1xuICAgIGlmICh0aGlzLiNvcHRpb25zLnByb2dyZXNzKSB7XG4gICAgICB0aGlzLiNvcHRpb25zLnByb2dyZXNzKHRoaXMuI3N0cmVhbS5jdXJzb3IpXG4gICAgfVxuICAgIGlmICh0aGlzLiNwZWVrKHRva2Vucy5jb21tZW50LnN0YXJ0KSkge1xuICAgICAgcmV0dXJuIHsgW3NjaGVtYS5jb21tZW50XTogdGhpcy4jY29tbWVudCh7IHBhdGggfSkgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jdGFnKHsgZG9jdW1lbnQsIHBhdGggfSlcbiAgfVxuXG4gIC8qKiBQcm9sb2cgcGFyc2VyICovXG4gICNwcm9sb2coeyBwYXRoIH06IHsgcGF0aDogbm9kZVtdIH0pIHtcbiAgICB0aGlzLiNkZWJ1ZyhwYXRoLCBcInBhcnNpbmcgcHJvbG9nXCIpXG4gICAgY29uc3QgcHJvbG9nID0gdGhpcy4jbWFrZS5ub2RlKHsgbmFtZTogXCJ4bWxcIiwgcGF0aCB9KVxuICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLnByb2xvZy5zdGFydClcblxuICAgIC8vVGFnIGF0dHJpYnV0ZXNcbiAgICB3aGlsZSAoIXRoaXMuI3BlZWsodG9rZW5zLnByb2xvZy5lbmQpKSB7XG4gICAgICAvLyBodHRwczovL3d3dy53My5vcmcvVFIvUkVDLXhtbC8jTlQtVmVyc2lvbk51bVxuICAgICAgT2JqZWN0LmFzc2lnbihwcm9sb2csIHRoaXMuI2F0dHJpYnV0ZSh7IHBhdGg6IFsuLi5wYXRoLCBwcm9sb2ddLCByYXc6IFtcInZlcnNpb25cIl0gfSkpXG4gICAgfVxuXG4gICAgLy9SZXN1bHRcbiAgICB0aGlzLiNjb25zdW1lKHRva2Vucy5wcm9sb2cuZW5kKVxuICAgIHJldHVybiB7IHhtbDogcHJvbG9nIH1cbiAgfVxuXG4gIC8qKiBTdHlsZXNoZWV0IHBhcnNlciAqL1xuICAjc3R5bGVzaGVldCh7IHBhdGggfTogeyBwYXRoOiBub2RlW10gfSkge1xuICAgIHRoaXMuI2RlYnVnKHBhdGgsIFwicGFyc2luZyBzdHlsZXNoZWV0XCIpXG4gICAgY29uc3Qgc3R5bGVzaGVldCA9IHRoaXMuI21ha2Uubm9kZSh7IG5hbWU6IFwieG1sLXN0eWxlc2hlZXRcIiwgcGF0aCB9KVxuICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLnN0eWxlc2hlZXQuc3RhcnQpXG5cbiAgICAvL1RhZyBhdHRyaWJ1dGVzXG4gICAgd2hpbGUgKCF0aGlzLiNwZWVrKHRva2Vucy5zdHlsZXNoZWV0LmVuZCkpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24oc3R5bGVzaGVldCwgdGhpcy4jYXR0cmlidXRlKHsgcGF0aDogWy4uLnBhdGgsIHN0eWxlc2hlZXRdIH0pKVxuICAgIH1cblxuICAgIC8vUmVzdWx0XG4gICAgdGhpcy4jY29uc3VtZSh0b2tlbnMuc3R5bGVzaGVldC5lbmQpXG4gICAgcmV0dXJuIHsgc3R5bGVzaGVldCB9XG4gIH1cblxuICAvKiogRG9jdHlwZSBwYXJzZXIgKi9cbiAgI2RvY3R5cGUoeyBwYXRoIH06IHsgcGF0aDogbm9kZVtdIH0pIHtcbiAgICB0aGlzLiNkZWJ1ZyhwYXRoLCBcInBhcnNpbmcgZG9jdHlwZVwiKVxuICAgIGNvbnN0IGRvY3R5cGUgPSB0aGlzLiNtYWtlLm5vZGUoeyBuYW1lOiBcImRvY3R5cGVcIiwgcGF0aCB9KVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkb2N0eXBlLCAkWE1MLCB7IGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9KVxuICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLmRvY3R5cGUuc3RhcnQpXG5cbiAgICAvL1RhZyBhdHRyaWJ1dGVzXG4gICAgd2hpbGUgKCF0aGlzLiNwZWVrKHRva2Vucy5kb2N0eXBlLmVuZCkpIHtcbiAgICAgIGlmICh0aGlzLiNwZWVrKHRva2Vucy5kb2N0eXBlLmVsZW1lbnRzLnN0YXJ0KSkge1xuICAgICAgICB0aGlzLiNjb25zdW1lKHRva2Vucy5kb2N0eXBlLmVsZW1lbnRzLnN0YXJ0KVxuICAgICAgICB3aGlsZSAoIXRoaXMuI3BlZWsodG9rZW5zLmRvY3R5cGUuZWxlbWVudHMuZW5kKSkge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZG9jdHlwZSwgdGhpcy4jZG9jdHlwZUVsZW1lbnQoeyBwYXRoIH0pKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLmRvY3R5cGUuZWxlbWVudHMuZW5kKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihkb2N0eXBlLCB0aGlzLiNwcm9wZXJ0eSh7IHBhdGggfSkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9SZXN1bHRcbiAgICB0aGlzLiNzdHJlYW0uY29uc3VtZSh7IGNvbnRlbnQ6IHRva2Vucy5kb2N0eXBlLmVuZCB9KVxuICAgIHJldHVybiB7IGRvY3R5cGUgfVxuICB9XG5cbiAgLyoqIERvY3R5cGUgZWxlbWVudCBwYXJzZXIgKi9cbiAgI2RvY3R5cGVFbGVtZW50KHsgcGF0aCB9OiB7IHBhdGg6IG5vZGVbXSB9KSB7XG4gICAgdGhpcy4jZGVidWcocGF0aCwgXCJwYXJzaW5nIGRvY3R5cGUgZWxlbWVudFwiKVxuXG4gICAgLy9FbGVtZW50IG5hbWVcbiAgICB0aGlzLiNjb25zdW1lKHRva2Vucy5kb2N0eXBlLmVsZW1lbnQuc3RhcnQpXG4gICAgY29uc3QgZWxlbWVudCA9IE9iamVjdC5rZXlzKHRoaXMuI3Byb3BlcnR5KHsgcGF0aCB9KSkuc2hpZnQoKSEuc3Vic3RyaW5nKHNjaGVtYS5wcm9wZXJ0eS5wcmVmaXgubGVuZ3RoKVxuICAgIHRoaXMuI2RlYnVnKHBhdGgsIGBmb3VuZCBkb2N0eXBlIGVsZW1lbnQgXCIke2VsZW1lbnR9XCJgKVxuXG4gICAgLy9FbGVtZW50IHZhbHVlXG4gICAgdGhpcy4jY29uc3VtZSh0b2tlbnMuZG9jdHlwZS5lbGVtZW50LnZhbHVlLnN0YXJ0KVxuICAgIGNvbnN0IHZhbHVlID0gdGhpcy4jY2FwdHVyZSh0b2tlbnMuZG9jdHlwZS5lbGVtZW50LnZhbHVlLnJlZ2V4LmVuZClcbiAgICB0aGlzLiNjb25zdW1lKHRva2Vucy5kb2N0eXBlLmVsZW1lbnQudmFsdWUuZW5kKVxuICAgIHRoaXMuI2RlYnVnKHBhdGgsIGBmb3VuZCBkb2N0eXBlIGVsZW1lbnQgdmFsdWUgXCIke3ZhbHVlfVwiYClcblxuICAgIC8vUmVzdWx0XG4gICAgdGhpcy4jY29uc3VtZSh0b2tlbnMuZG9jdHlwZS5lbGVtZW50LmVuZClcbiAgICByZXR1cm4geyBbZWxlbWVudF06IHZhbHVlIH1cbiAgfVxuXG4gIC8qKiBUYWcgcGFyc2VyICovXG4gICN0YWcoeyBkb2N1bWVudCwgcGF0aCB9OiB7IGRvY3VtZW50OiBub2RlOyBwYXRoOiBub2RlW10gfSkge1xuICAgIHRoaXMuI2RlYnVnKHBhdGgsIFwicGFyc2luZyB0YWdcIilcbiAgICBjb25zdCB0YWcgPSB0aGlzLiNtYWtlLm5vZGUoeyBwYXRoIH0pXG5cbiAgICAvL1RhZyBuYW1lXG4gICAgdGhpcy4jY29uc3VtZSh0b2tlbnMudGFnLnN0YXJ0KVxuICAgIGNvbnN0IG5hbWUgPSB0aGlzLiNjYXB0dXJlKHRva2Vucy50YWcucmVnZXgubmFtZSlcbiAgICBPYmplY3QuYXNzaWduKHRhZ1skWE1MXSwgeyBuYW1lIH0pXG4gICAgdGhpcy4jZGVidWcocGF0aCwgYGZvdW5kIHRhZyBcIiR7bmFtZX1cImApXG5cbiAgICAvL1RhZyBhdHRyaWJ1dGVzXG4gICAgd2hpbGUgKCF0b2tlbnMudGFnLmNsb3NlLnJlZ2V4LmVuZC50ZXN0KHRoaXMuI3N0cmVhbS5wZWVrKDIpKSkge1xuICAgICAgT2JqZWN0LmFzc2lnbih0YWcsIHRoaXMuI2F0dHJpYnV0ZSh7IHBhdGg6IFsuLi5wYXRoLCB0YWddIH0pKVxuICAgIH1cblxuICAgIC8vSG9ub3IgeG1sOnNwYWNlIGRpcmVjdGl2ZVxuICAgIGxldCB0cmltID0gdHJ1ZVxuICAgIGlmICh0YWdbYCR7c2NoZW1hLmF0dHJpYnV0ZS5wcmVmaXh9JHtzY2hlbWEuc3BhY2UubmFtZX1gXSA9PT0gc2NoZW1hLnNwYWNlLnByZXNlcnZlKSB7XG4gICAgICB0aGlzLiNkZWJ1ZyhbLi4ucGF0aCwgdGFnXSwgYCR7c2NoZW1hLnNwYWNlLm5hbWV9IGlzIHNldCB0byAke3NjaGVtYS5zcGFjZS5wcmVzZXJ2ZX1gKVxuICAgICAgdHJpbSA9IGZhbHNlXG4gICAgfVxuXG4gICAgLy9TZWxmLWNsb3NlZCB0YWdcbiAgICBjb25zdCBzZWxmY2xvc2VkID0gdGhpcy4jcGVlayh0b2tlbnMudGFnLmNsb3NlLnNlbGYpXG4gICAgaWYgKHNlbGZjbG9zZWQpIHtcbiAgICAgIHRoaXMuI2RlYnVnKHBhdGgsIGB0YWcgXCIke25hbWV9XCIgaXMgc2VsZi1jbG9zZWRgKVxuICAgICAgdGhpcy4jY29uc3VtZSh0b2tlbnMudGFnLmNsb3NlLnNlbGYpXG4gICAgfVxuICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLnRhZy5lbmQsIHsgdHJpbSB9KVxuXG4gICAgLy9QYWlyLWNsb3NlZCB0YWdcbiAgICBpZiAoIXNlbGZjbG9zZWQpIHtcbiAgICAgIC8vVGV4dCBub2RlXG4gICAgICBpZiAoKHRoaXMuI3BlZWsodG9rZW5zLmNkYXRhLnN0YXJ0KSkgfHwgKCF0aGlzLiNwZWVrKHRva2Vucy50YWcuc3RhcnQpKSkge1xuICAgICAgICBPYmplY3QuYXNzaWduKHRhZywgdGhpcy4jdGV4dCh7IGRvY3VtZW50LCBjbG9zZTogbmFtZSwgcGF0aDogWy4uLnBhdGgsIHRhZ10sIHRyaW0gfSkpXG4gICAgICB9IC8vQ2hpbGQgbm9kZXNcbiAgICAgIGVsc2Uge1xuICAgICAgICB3aGlsZSAoIXRva2Vucy50YWcuY2xvc2UucmVnZXguc3RhcnQudGVzdCh0aGlzLiNzdHJlYW0ucGVlaygyKSkpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuI25vZGUoeyBkb2N1bWVudCwgcGF0aDogWy4uLnBhdGgsIHRhZ10gfSlcbiAgICAgICAgICBjb25zdCBba2V5LCB2YWx1ZV0gPSBPYmplY3QuZW50cmllcyhjaGlsZCkuc2hpZnQoKSFcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0YWdba2V5XSkpIHtcbiAgICAgICAgICAgIDsodGFnW2tleV0gYXMgdW5rbm93bltdKS5wdXNoKHZhbHVlKVxuICAgICAgICAgICAgdGhpcy4jZGVidWcoWy4uLnBhdGgsIHRhZ10sIGBhZGQgbmV3IGNoaWxkIFwiJHtrZXl9XCIgdG8gYXJyYXlgKVxuICAgICAgICAgIH0gZWxzZSBpZiAoa2V5IGluIHRhZykge1xuICAgICAgICAgICAgY29uc3QgYXJyYXkgPSBbdGFnW2tleV0sIHZhbHVlXVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGFycmF5LCAkWE1MLCB7IGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgaWYgKCh0YWdba2V5XSBhcyBub2RlKT8uWyRYTUxdKSB7XG4gICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oYXJyYXksIHsgWyRYTUxdOiAodGFnW2tleV0gYXMgbm9kZSlbJFhNTF0gfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhZ1trZXldID0gYXJyYXlcbiAgICAgICAgICAgIHRoaXMuI2RlYnVnKFsuLi5wYXRoLCB0YWddLCBgbXVsdGlwbGUgY2hpbGRyZW4gbmFtZWQgXCIke2tleX1cIiwgdXNpbmcgYXJyYXkgbm90YXRpb25gKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRhZywgY2hpbGQpXG4gICAgICAgICAgICB0aGlzLiNkZWJ1ZyhbLi4ucGF0aCwgdGFnXSwgYGFkZCBuZXcgY2hpbGQgXCIke2tleX1cImApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vQ2xvc2luZyB0YWdcbiAgICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLnRhZy5jbG9zZS5zdGFydClcbiAgICAgIHRoaXMuI2NvbnN1bWUobmFtZSlcbiAgICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLnRhZy5jbG9zZS5lbmQpXG4gICAgICB0aGlzLiNkZWJ1ZyhwYXRoLCBgZm91bmQgY2xvc2luZyB0YWcgZm9yIFwiJHtuYW1lfVwiYClcbiAgICB9XG5cbiAgICAvL1Jlc3VsdFxuICAgIGZvciAoY29uc3QgW2tleV0gb2YgT2JqZWN0LmVudHJpZXModGFnKS5maWx0ZXIoKFtfLCB2YWx1ZV0pID0+IHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikpIHtcbiAgICAgIGRlbGV0ZSB0YWdba2V5XVxuICAgIH1cbiAgICBpZiAoIU9iamVjdC5rZXlzKHRhZykuaW5jbHVkZXMoc2NoZW1hLnRleHQpKSB7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IE9iamVjdC5rZXlzKHRhZykuZmlsdGVyKChrZXkpID0+XG4gICAgICAgICgha2V5LnN0YXJ0c1dpdGgoc2NoZW1hLmF0dHJpYnV0ZS5wcmVmaXgpKSAmJlxuICAgICAgICAoa2V5ICE9PSBzY2hlbWEudGV4dClcbiAgICAgIClcbiAgICAgIGlmICghY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuI2RlYnVnKHBhdGgsIGB0YWcgXCIke25hbWV9XCIgaGFzIGltcGxpY3RlbHkgb2J0YWluZWQgYSB0ZXh0IG5vZGUgYXMgaXQgaGFzIG5vIGNoaWxkcmVuIGJ1dCBoYXMgYXR0cmlidXRlc2ApXG4gICAgICAgIHRhZ1tzY2hlbWEudGV4dF0gPSB0aGlzLiNyZXZpdmUoeyBrZXk6IHNjaGVtYS50ZXh0LCB2YWx1ZTogXCJcIiwgdGFnIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChcbiAgICAgICh0aGlzLiNvcHRpb25zLmZsYXR0ZW4gPz8gdHJ1ZSkgJiZcbiAgICAgIChPYmplY3Qua2V5cyh0YWcpLmluY2x1ZGVzKHNjaGVtYS50ZXh0KSkgJiZcbiAgICAgIChPYmplY3Qua2V5cyh0YWcpLmxlbmd0aCA9PT0gMSlcbiAgICApIHtcbiAgICAgIHRoaXMuI2RlYnVnKHBhdGgsIGB0YWcgXCIke25hbWV9XCIgaGFzIGJlZW4gaW1wbGljaXRlbHkgZmxhdHRlbmVkIGFzIGl0IG9ubHkgaGFzIGEgdGV4dCBub2RlYClcbiAgICAgIHJldHVybiB7IFtuYW1lXTogdGFnW3NjaGVtYS50ZXh0XSB9XG4gICAgfVxuICAgIHJldHVybiB7IFtuYW1lXTogdGFnIH1cbiAgfVxuXG4gIC8qKiBBdHRyaWJ1dGUgcGFyc2VyICovXG4gICNhdHRyaWJ1dGUoeyBwYXRoLCByYXcgPSBbXSB9OiB7IHBhdGg6IG5vZGVbXTsgcmF3Pzogc3RyaW5nW10gfSkge1xuICAgIHRoaXMuI2RlYnVnKHBhdGgsIFwicGFyc2luZyBhdHRyaWJ1dGVcIilcblxuICAgIC8vQXR0cmlidXRlIG5hbWVcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLiNjYXB0dXJlKHRva2Vucy50YWcuYXR0cmlidXRlLnJlZ2V4Lm5hbWUpXG4gICAgdGhpcy4jZGVidWcocGF0aCwgYGZvdW5kIGF0dHJpYnV0ZSBcIiR7YXR0cmlidXRlfVwiYClcblxuICAgIC8vQXR0cmlidXRlIHZhbHVlXG4gICAgdGhpcy4jY29uc3VtZShcIj1cIilcbiAgICBjb25zdCBxdW90ZSA9IHRoaXMuI3N0cmVhbS5wZWVrKClcbiAgICB0aGlzLiNjb25zdW1lKHF1b3RlKVxuICAgIGNvbnN0IHZhbHVlID0gdGhpcy4jY2FwdHVyZSh7IHVudGlsOiBuZXcgUmVnRXhwKHF1b3RlKSwgYnl0ZXM6IHF1b3RlLmxlbmd0aCB9KVxuICAgIHRoaXMuI2NvbnN1bWUocXVvdGUpXG4gICAgdGhpcy4jZGVidWcocGF0aCwgYGZvdW5kIGF0dHJpYnV0ZSB2YWx1ZSBcIiR7dmFsdWV9XCJgKVxuXG4gICAgLy9SZXN1bHRcbiAgICByZXR1cm4ge1xuICAgICAgW2Ake3NjaGVtYS5hdHRyaWJ1dGUucHJlZml4fSR7YXR0cmlidXRlfWBdOiByYXcuaW5jbHVkZXMoYXR0cmlidXRlKSA/IHZhbHVlIDogdGhpcy4jcmV2aXZlKHtcbiAgICAgICAga2V5OiBgJHtzY2hlbWEuYXR0cmlidXRlLnByZWZpeH0ke2F0dHJpYnV0ZX1gLFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgdGFnOiBwYXRoLmF0KC0xKSEsXG4gICAgICB9KSxcbiAgICB9XG4gIH1cblxuICAvKiogUHJvcGVydHkgcGFyc2VyICovXG4gICNwcm9wZXJ0eSh7IHBhdGggfTogeyBwYXRoOiBub2RlW10gfSkge1xuICAgIHRoaXMuI2RlYnVnKHBhdGgsIFwicGFyc2luZyBwcm9wZXJ0eVwiKVxuXG4gICAgLy9Qcm9wZXJ0eSBuYW1lXG4gICAgbGV0IHByb3BlcnR5XG5cbiAgICBjb25zdCBxdW90ZSA9IHRoaXMuI3N0cmVhbS5wZWVrKClcbiAgICBpZiAoL1tcIiddLy50ZXN0KHF1b3RlKSkge1xuICAgICAgdGhpcy4jY29uc3VtZShxdW90ZSlcbiAgICAgIHByb3BlcnR5ID0gdGhpcy4jY2FwdHVyZSh7IHVudGlsOiBuZXcgUmVnRXhwKHF1b3RlKSwgYnl0ZXM6IDEgfSlcbiAgICAgIHRoaXMuI2NvbnN1bWUocXVvdGUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BlcnR5ID0gdGhpcy4jY2FwdHVyZSh7IHVudGlsOiAvW1xccz5dLywgYnl0ZXM6IDEgfSlcbiAgICB9XG5cbiAgICB0aGlzLiNkZWJ1ZyhwYXRoLCBgZm91bmQgcHJvcGVydHkgJHtwcm9wZXJ0eX1gKVxuXG4gICAgLy9SZXN1bHRcbiAgICByZXR1cm4geyBbYCR7c2NoZW1hLnByb3BlcnR5LnByZWZpeH0ke3Byb3BlcnR5fWBdOiB0cnVlIH1cbiAgfVxuXG4gIC8qKiBUZXh0IHBhcnNlciAqL1xuICAjdGV4dCh7IGRvY3VtZW50LCBjbG9zZSwgcGF0aCwgdHJpbSB9OiB7IGRvY3VtZW50OiBub2RlOyBjbG9zZTogc3RyaW5nOyBwYXRoOiBub2RlW107IHRyaW06IGJvb2xlYW4gfSkge1xuICAgIHRoaXMuI2RlYnVnKHBhdGgsIFwicGFyc2luZyB0ZXh0XCIpXG4gICAgY29uc3QgdGFnID0gdGhpcy4jbWFrZS5ub2RlKHsgbmFtZTogc2NoZW1hLnRleHQsIHBhdGggfSlcbiAgICBsZXQgdGV4dCA9IFwiXCJcbiAgICBjb25zdCBjb21tZW50cyA9IFtdXG5cbiAgICAvL0NvbnRlbnRcbiAgICB3aGlsZSAoXG4gICAgICAodGhpcy4jcGVlayh0b2tlbnMuY2RhdGEuc3RhcnQpKSB8fFxuICAgICAgKCF0aGlzLiNwZWVrcyhbdG9rZW5zLnRhZy5jbG9zZS5zdGFydCwgY2xvc2UsIHRva2Vucy50YWcuY2xvc2UuZW5kXSkpXG4gICAgKSB7XG4gICAgICAvL0NEQVRBXG4gICAgICBpZiAodGhpcy4jcGVlayh0b2tlbnMuY2RhdGEuc3RhcnQpKSB7XG4gICAgICAgIGNvbnN0IGNwYXRoID0gcGF0aC5tYXAoKG5vZGUpID0+IG5vZGVbJFhNTF0ubmFtZSlcbiAgICAgICAgZG9jdW1lbnRbJFhNTF0uY2RhdGE/LnB1c2goY3BhdGgpXG4gICAgICAgIHRoaXMuI2RlYnVnKHBhdGgsIGB0ZXh0IGlzIHNwZWNpZmllZCBhcyBjZGF0YSwgc3RvcmluZyBwYXRoID4ke2NwYXRoLmpvaW4oXCI+XCIpfSBpbiBkb2N1bWVudCBtZXRhZGF0YWApXG4gICAgICAgIHRleHQgKz0gdGhpcy4jY2RhdGEoeyBwYXRoOiBbLi4ucGF0aCwgdGFnXSB9KVxuICAgICAgfSAvL0NvbW1lbnRzXG4gICAgICBlbHNlIGlmICh0aGlzLiNwZWVrKHRva2Vucy5jb21tZW50LnN0YXJ0KSkge1xuICAgICAgICBjb21tZW50cy5wdXNoKHRoaXMuI2NvbW1lbnQoeyBwYXRoOiBbLi4ucGF0aCwgdGFnXSB9KSlcbiAgICAgIH0gLy9SYXcgdGV4dFxuICAgICAgZWxzZSB7XG4gICAgICAgIHRleHQgKz0gdGhpcy4jY2FwdHVyZSh7IC4uLnRva2Vucy50ZXh0LnJlZ2V4LmVuZCB9LCB7IHRyaW0gfSlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLiNwZWVrKHRva2Vucy5jZGF0YS5zdGFydCkpIHx8XG4gICAgICAgICAgKHRoaXMuI3BlZWsodG9rZW5zLmNvbW1lbnQuc3RhcnQpKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy4jcGVla3MoW3Rva2Vucy50YWcuY2xvc2Uuc3RhcnQsIGNsb3NlLCB0b2tlbnMudGFnLmNsb3NlLmVuZF0pKSB7XG4gICAgICAgICAgdGV4dCArPSB0b2tlbnMudGFnLmNsb3NlLnN0YXJ0XG4gICAgICAgICAgdGhpcy4jY29uc3VtZSh0b2tlbnMudGFnLmNsb3NlLnN0YXJ0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuI2RlYnVnKHBhdGgsIGBwYXJzZWQgdGV4dCBcIiR7dGV4dH1cImApXG4gICAgaWYgKGNvbW1lbnRzLmxlbmd0aCkge1xuICAgICAgdGhpcy4jZGVidWcocGF0aCwgYHBhcnNlZCBjb21tZW50cyAke0pTT04uc3RyaW5naWZ5KGNvbW1lbnRzKX1gKVxuICAgIH1cblxuICAgIC8vUmVzdWx0XG4gICAgT2JqZWN0LmFzc2lnbih0YWcsIHtcbiAgICAgIFtzY2hlbWEudGV4dF06IHRoaXMuI3Jldml2ZSh7IGtleTogc2NoZW1hLnRleHQsIHZhbHVlOiB0cmltID8gdGV4dC50cmltKCkgOiB0ZXh0LCB0YWc6IHBhdGguYXQoLTEpISB9KSxcbiAgICAgIC4uLihjb21tZW50cy5sZW5ndGggPyB7IFtzY2hlbWEuY29tbWVudF06IGNvbW1lbnRzIH0gOiB7fSksXG4gICAgfSlcbiAgICByZXR1cm4gdGFnXG4gIH1cblxuICAvKiogQ0RBVEEgcGFyc2VyICovXG4gICNjZGF0YSh7IHBhdGggfTogeyBwYXRoOiBub2RlW10gfSkge1xuICAgIHRoaXMuI2RlYnVnKHBhdGgsIFwicGFyc2luZyBjZGF0YVwiKVxuICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLmNkYXRhLnN0YXJ0KVxuICAgIGNvbnN0IGRhdGEgPSB0aGlzLiNjYXB0dXJlKHRva2Vucy5jZGF0YS5yZWdleC5lbmQpXG4gICAgdGhpcy4jY29uc3VtZSh0b2tlbnMuY2RhdGEuZW5kKVxuICAgIHJldHVybiBkYXRhXG4gIH1cblxuICAvKiogQ29tbWVudCBwYXJzZXIgKi9cbiAgI2NvbW1lbnQoeyBwYXRoIH06IHsgcGF0aDogbm9kZVtdIH0pIHtcbiAgICB0aGlzLiNkZWJ1ZyhwYXRoLCBcInBhcnNpbmcgY29tbWVudFwiKVxuICAgIHRoaXMuI2NvbnN1bWUodG9rZW5zLmNvbW1lbnQuc3RhcnQpXG4gICAgY29uc3QgY29tbWVudCA9IHRoaXMuI2NhcHR1cmUodG9rZW5zLmNvbW1lbnQucmVnZXguZW5kKS50cmltKClcbiAgICB0aGlzLiNjb25zdW1lKHRva2Vucy5jb21tZW50LmVuZClcbiAgICByZXR1cm4gY29tbWVudFxuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIC8qKiBSZXZpdmVyICovXG4gICNyZXZpdmUoeyBrZXksIHZhbHVlLCB0YWcgfTogeyBrZXk6IHN0cmluZzsgdmFsdWU6IHN0cmluZzsgdGFnOiBub2RlIH0pIHtcbiAgICByZXR1cm4gdGhpcy4jb3B0aW9ucy5yZXZpdmVyIS5jYWxsKHRhZywge1xuICAgICAga2V5LFxuICAgICAgdGFnOiB0YWdbJFhNTF0ubmFtZSxcbiAgICAgIHByb3BlcnRpZXM6ICEoa2V5LnN0YXJ0c1dpdGgoc2NoZW1hLmF0dHJpYnV0ZS5wcmVmaXgpIHx8XG4gICAgICAgICAga2V5LnN0YXJ0c1dpdGgoc2NoZW1hLnByb3BlcnR5LnByZWZpeCkpXG4gICAgICAgID8geyAuLi50YWcgfVxuICAgICAgICA6IG51bGwsXG4gICAgICB2YWx1ZTogKCgpID0+IHtcbiAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgICAgLy9Db252ZXJ0IGVtcHR5IHZhbHVlcyB0byBudWxsXG4gICAgICAgICAgY2FzZSAodGhpcy4jb3B0aW9ucy5lbXB0eVRvTnVsbCA/PyB0cnVlKSAmJiAvXlxccyokLy50ZXN0KHZhbHVlKTpcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgLy9SZXZpdmUgYm9vbGVhbnNcbiAgICAgICAgICBjYXNlICh0aGlzLiNvcHRpb25zLnJldml2ZUJvb2xlYW5zKSAmJiAvXig/OnRydWV8ZmFsc2UpJC9pLnRlc3QodmFsdWUpOlxuICAgICAgICAgICAgcmV0dXJuIC9edHJ1ZSQvaS50ZXN0KHZhbHVlKVxuICAgICAgICAgIC8vUmV2aXZlIG51bWJlcnNcbiAgICAgICAgICBjYXNlIHRoaXMuI29wdGlvbnMucmV2aXZlTnVtYmVyczoge1xuICAgICAgICAgICAgY29uc3QgbnVtID0gTnVtYmVyKHZhbHVlKVxuICAgICAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShudW0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBudW1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgIC8vU3RyaW5nc1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvL1VuZXNjYXBlIFhNTCBlbnRpdGllc1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKFxuICAgICAgICAgICAgICB0b2tlbnMuZW50aXR5LnJlZ2V4LmVudGl0aWVzLFxuICAgICAgICAgICAgICAoXywgaGV4LCBjb2RlKSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KGNvZGUsIGhleCA/IDE2IDogMTApKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2VudGl0eSwgY2hhcmFjdGVyXSBvZiBPYmplY3QuZW50cmllcyhlbnRpdGllcy54bWwpKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZUFsbChlbnRpdHksIGNoYXJhY3RlcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICB9XG4gICAgICB9KSgpLFxuICAgIH0pXG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLyoqIE1ha2VycyAqL1xuICAjbWFrZSA9IHtcbiAgICAvKiogTm9kZSBtYWtlciAqL1xuICAgIG5vZGUoeyBuYW1lID0gXCJcIiwgcGF0aCA9IFtdIGFzIG5vZGVbXSB9KSB7XG4gICAgICBjb25zdCBub2RlID0geyBbJFhNTF06IHsgbmFtZSwgcGFyZW50OiBwYXRoW3BhdGgubGVuZ3RoIC0gMV0gPz8gbnVsbCB9IH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShub2RlLCAkWE1MLCB7IGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9KVxuICAgICAgcmV0dXJuIG5vZGUgYXMgbm9kZVxuICAgIH0sXG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLyoqIFRleHQgc3RyZWFtICovXG4gIHJlYWRvbmx5ICNzdHJlYW06IFN0cmVhbVxuXG4gIC8qKiBQZWVrIGFuZCB2YWxpZGF0ZSBhZ2FpbnN0IHRva2VuICovXG4gICNwZWVrKHRva2VuOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4jc3RyZWFtLnBlZWsodG9rZW4ubGVuZ3RoKSA9PT0gdG9rZW5cbiAgfVxuXG4gIC8qKiBQZWVrIGFuZCB2YWxpZGF0ZSBhZ2FpbnN0IHRva2VucyAqL1xuICAjcGVla3ModG9rZW5zOiBzdHJpbmdbXSkge1xuICAgIGxldCBvZmZzZXQgPSAwXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHRva2VuID0gdG9rZW5zW2ldXG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAvL0lnbm9yZSB3aGl0ZXNwYWNlc1xuICAgICAgICBpZiAoL1xccy8udGVzdCh0aGlzLiNzdHJlYW0ucGVlaygxLCBvZmZzZXQpKSkge1xuICAgICAgICAgIG9mZnNldCsrXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgICAvL1ZhbGlkYXRlIHRva2VuXG4gICAgICAgIGlmICh0aGlzLiNzdHJlYW0ucGVlayh0b2tlbi5sZW5ndGgsIG9mZnNldCkgPT09IHRva2VuKSB7XG4gICAgICAgICAgb2Zmc2V0ICs9IHRva2VuLmxlbmd0aFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKiogQ29uc3VtZSB0b2tlbiAqL1xuICAjY29uc3VtZSh0b2tlbjogc3RyaW5nLCB7IHRyaW0gfTogeyB0cmltPzogYm9vbGVhbiB9ID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy4jc3RyZWFtLmNvbnN1bWUoeyBjb250ZW50OiB0b2tlbiwgdHJpbSB9KVxuICB9XG5cbiAgLyoqIENhcHR1cmUgdW50aWwgbmV4dCB0b2tlbiAqL1xuICAjY2FwdHVyZSh0b2tlbjogeyB1bnRpbDogUmVnRXhwOyBieXRlczogbnVtYmVyOyBsZW5ndGg/OiBudW1iZXIgfSwgeyB0cmltIH06IHsgdHJpbT86IGJvb2xlYW4gfSA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuI3N0cmVhbS5jYXB0dXJlKHsgLi4udG9rZW4sIHRyaW0gfSlcbiAgfVxuXG4gIC8qKiBUcmltIHN0cmVhbSAqL1xuICAjdHJpbSgpIHtcbiAgICByZXR1cm4gdGhpcy4jc3RyZWFtLnRyaW0oKVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUztBQUVULFNBQVMsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxRQUFRLGFBQVk7QUFHM0Q7O0NBRUMsR0FDRCxPQUFPLE1BQU07RUFDWCxnQkFBZ0IsR0FDaEIsWUFBWSxNQUFjLEVBQUUsVUFBeUIsQ0FBQyxDQUFDLENBQUU7SUFDdkQsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHO0lBQ2YsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHO0lBQ2hCLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEtBQUssU0FBVSxFQUFFLEtBQUssRUFBRTtNQUMzQyxPQUFPO0lBQ1Q7RUFDRjtFQUVBLG1CQUFtQixHQUNuQixRQUFRO0lBQ04sT0FBTyxJQUFJLENBQUMsQ0FBQyxRQUFRO0VBQ3ZCO0VBRUEsWUFBWSxHQUNaLEFBQVMsQ0FBQyxPQUFPLENBQWU7RUFFaEMsYUFBYSxHQUNiLENBQUMsS0FBSyxDQUFDLElBQVksRUFBRSxNQUFjO0lBQ2pDLElBQUksSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtNQUN2QixRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxP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