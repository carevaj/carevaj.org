var _computedKey, _computedKey1;
import { CTOR_KEY } from "../constructor-lock.ts";
import { fragmentNodesFromString } from "../deserialize.ts";
import { Node, nodesAndTextNodes, NodeType } from "./node.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
import { getDatasetHtmlAttrName, getDatasetJavascriptName, getElementsByClassName, getOuterOrInnerHtml, insertBeforeAfter, lowerCaseCharRe, upperCaseCharRe } from "./utils.ts";
import UtilTypes from "./utils-types.ts";
_computedKey = Symbol.iterator;
export class DOMTokenList {
  #_value = "";
  get #value() {
    return this.#_value;
  }
  set #value(value) {
    this.#_value = value;
    this.#onChange(value);
  }
  #set = new Set();
  #onChange;
  constructor(onChange, key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor");
    }
    this.#onChange = onChange;
  }
  static #invalidToken(token) {
    return token === "" || /[\t\n\f\r ]/.test(token);
  }
  #setIndices() {
    const classes = Array.from(this.#set);
    for(let i = 0; i < classes.length; i++){
      this[i] = classes[i];
    }
  }
  set value(input) {
    this.#value = input;
    this.#set = new Set(input.trim().split(/[\t\n\f\r\s]+/g).filter(Boolean));
    this.#setIndices();
  }
  get value() {
    return this.#_value;
  }
  get length() {
    return this.#set.size;
  }
  *entries() {
    const array = Array.from(this.#set);
    for(let i = 0; i < array.length; i++){
      yield [
        i,
        array[i]
      ];
    }
  }
  *values() {
    yield* this.#set.values();
  }
  *keys() {
    for(let i = 0; i < this.#set.size; i++){
      yield i;
    }
  }
  *[_computedKey]() {
    yield* this.#set.values();
  }
  item(index) {
    index = Number(index);
    if (Number.isNaN(index) || index === Infinity) index = 0;
    return this[Math.trunc(index) % 2 ** 32] ?? null;
  }
  contains(element) {
    return this.#set.has(element);
  }
  add(...elements) {
    for (const element of elements){
      if (DOMTokenList.#invalidToken(element)) {
        throw new DOMException("Failed to execute 'add' on 'DOMTokenList': The token provided must not be empty.");
      }
      const { size } = this.#set;
      this.#set.add(element);
      if (size < this.#set.size) {
        this[size] = element;
      }
    }
    this.#updateClassString();
  }
  remove(...elements) {
    const { size } = this.#set;
    for (const element of elements){
      if (DOMTokenList.#invalidToken(element)) {
        throw new DOMException("Failed to execute 'remove' on 'DOMTokenList': The token provided must not be empty.");
      }
      this.#set.delete(element);
    }
    if (size !== this.#set.size) {
      for(let i = this.#set.size; i < size; i++){
        delete this[i];
      }
      this.#setIndices();
    }
    this.#updateClassString();
  }
  replace(oldToken, newToken) {
    if ([
      oldToken,
      newToken
    ].some((v)=>DOMTokenList.#invalidToken(v))) {
      throw new DOMException("Failed to execute 'replace' on 'DOMTokenList': The token provided must not be empty.");
    }
    if (!this.#set.has(oldToken)) {
      return false;
    }
    if (this.#set.has(newToken)) {
      this.remove(oldToken);
    } else {
      this.#set.delete(oldToken);
      this.#set.add(newToken);
      this.#setIndices();
      this.#updateClassString();
    }
    return true;
  }
  supports() {
    throw new Error("Not implemented");
  }
  toggle(element, force) {
    if (force !== undefined) {
      const operation = force ? "add" : "remove";
      this[operation](element);
      return false;
    } else {
      const contains = this.contains(element);
      const operation = contains ? "remove" : "add";
      this[operation](element);
      return !contains;
    }
  }
  forEach(callback) {
    for (const [i, value] of this.entries()){
      callback(value, i, this);
    }
  }
  #updateClassString() {
    this.#value = Array.from(this.#set).join(" ");
  }
}
const setNamedNodeMapOwnerElementSym = Symbol();
const setAttrValueSym = Symbol();
export class Attr extends Node {
  #namedNodeMap = null;
  #name = "";
  #value = "";
  #ownerElement = null;
  constructor(map, name, value, key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor");
    }
    super(name, NodeType.ATTRIBUTE_NODE, null, CTOR_KEY);
    this.#name = name;
    this.#value = value;
    this.#namedNodeMap = map;
  }
  [setNamedNodeMapOwnerElementSym](ownerElement) {
    this.#ownerElement = ownerElement;
    this.#namedNodeMap = ownerElement?.attributes ?? null;
    if (ownerElement) {
      this._setOwnerDocument(ownerElement.ownerDocument);
    }
  }
  [setAttrValueSym](value) {
    this.#value = value;
  }
  _shallowClone() {
    const newAttr = new Attr(null, this.#name, this.#value, CTOR_KEY);
    newAttr._setOwnerDocument(this.ownerDocument);
    return newAttr;
  }
  cloneNode() {
    return super.cloneNode();
  }
  appendChild() {
    throw new DOMException("Cannot add children to an Attribute");
  }
  replaceChild() {
    throw new DOMException("Cannot add children to an Attribute");
  }
  insertBefore() {
    throw new DOMException("Cannot add children to an Attribute");
  }
  removeChild() {
    throw new DOMException("The node to be removed is not a child of this node");
  }
  get name() {
    return this.#name;
  }
  get localName() {
    // TODO: When we make namespaces a thing this needs
    // to be updated
    return this.#name;
  }
  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = String(value);
    if (this.#namedNodeMap) {
      this.#namedNodeMap[setNamedNodeMapValueSym](this.#name, this.#value, true);
    }
  }
  get ownerElement() {
    return this.#ownerElement ?? null;
  }
  get specified() {
    return true;
  }
  // TODO
  get prefix() {
    return null;
  }
}
const setNamedNodeMapValueSym = Symbol();
const getNamedNodeMapValueSym = Symbol();
const getNamedNodeMapAttrNamesSym = Symbol();
const getNamedNodeMapAttrNodeSym = Symbol();
const removeNamedNodeMapAttrSym = Symbol();
_computedKey1 = Symbol.iterator;
export class NamedNodeMap {
  static #indexedAttrAccess = function(map, index) {
    if (index + 1 > this.length) {
      return undefined;
    }
    const attribute = Object.keys(map).filter((attribute)=>map[attribute] !== undefined)[index]?.slice(1); // Remove "a" for safeAttrName
    return this[getNamedNodeMapAttrNodeSym](attribute);
  };
  #onAttrNodeChange;
  constructor(ownerElement, onAttrNodeChange, key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor.");
    }
    this.#ownerElement = ownerElement;
    this.#onAttrNodeChange = onAttrNodeChange;
  }
  #attrNodeCache = {};
  #map = {};
  #length = 0;
  #capacity = 0;
  #ownerElement = null;
  [getNamedNodeMapAttrNodeSym](attribute) {
    const safeAttrName = "a" + attribute;
    let attrNode = this.#attrNodeCache[safeAttrName];
    if (!attrNode) {
      attrNode = this.#attrNodeCache[safeAttrName] = new Attr(this, attribute, this.#map[safeAttrName], CTOR_KEY);
      attrNode[setNamedNodeMapOwnerElementSym](this.#ownerElement);
    }
    return attrNode;
  }
  [getNamedNodeMapAttrNamesSym]() {
    const names = [];
    for (const [name, value] of Object.entries(this.#map)){
      if (value !== undefined) {
        names.push(name.slice(1)); // Remove "a" for safeAttrName
      }
    }
    return names;
  }
  [getNamedNodeMapValueSym](attribute) {
    const safeAttrName = "a" + attribute;
    return this.#map[safeAttrName];
  }
  [setNamedNodeMapValueSym](attribute, value, bubble = false) {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] === undefined) {
      this.#length++;
      if (this.#length > this.#capacity) {
        this.#capacity = this.#length;
        const index = this.#capacity - 1;
        Object.defineProperty(this, String(this.#capacity - 1), {
          get: NamedNodeMap.#indexedAttrAccess.bind(this, this.#map, index)
        });
      }
    } else if (this.#attrNodeCache[safeAttrName]) {
      this.#attrNodeCache[safeAttrName][setAttrValueSym](value);
    }
    this.#map[safeAttrName] = value;
    if (bubble) {
      this.#onAttrNodeChange(attribute, value);
    }
  }
  /**
   * Called when an attribute is removed from
   * an element
   */ [removeNamedNodeMapAttrSym](attribute) {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] !== undefined) {
      this.#length--;
      this.#map[safeAttrName] = undefined;
      this.#onAttrNodeChange(attribute, null);
      const attrNode = this.#attrNodeCache[safeAttrName];
      if (attrNode) {
        attrNode[setNamedNodeMapOwnerElementSym](null);
        this.#attrNodeCache[safeAttrName] = undefined;
      }
    }
  }
  *[_computedKey1]() {
    for(let i = 0; i < this.length; i++){
      yield this[i];
    }
  }
  get length() {
    return this.#length;
  }
  // FIXME: This method should accept anything and basically
  // coerce any non numbers (and Infinity/-Infinity) into 0
  item(index) {
    if (index >= this.#length) {
      return null;
    }
    return this[index];
  }
  getNamedItem(attribute) {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] !== undefined) {
      return this[getNamedNodeMapAttrNodeSym](attribute);
    }
    return null;
  }
  setNamedItem(attrNode) {
    if (attrNode.ownerElement) {
      throw new DOMException("Attribute already in use");
    }
    const safeAttrName = "a" + attrNode.name;
    const previousAttr = this.#attrNodeCache[safeAttrName];
    if (previousAttr) {
      previousAttr[setNamedNodeMapOwnerElementSym](null);
      this.#map[safeAttrName] = undefined;
    }
    attrNode[setNamedNodeMapOwnerElementSym](this.#ownerElement);
    this.#attrNodeCache[safeAttrName] = attrNode;
    this[setNamedNodeMapValueSym](attrNode.name, attrNode.value, true);
  }
  removeNamedItem(attribute) {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] !== undefined) {
      const attrNode = this[getNamedNodeMapAttrNodeSym](attribute);
      this[removeNamedNodeMapAttrSym](attribute);
      return attrNode;
    }
    throw new DOMException("Node was not found");
  }
}
const XML_NAMESTART_CHAR_RE_SRC = ":A-Za-z_" + String.raw`\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}` + String.raw`\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}` + String.raw`\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}`;
const XML_NAME_CHAR_RE_SRC = XML_NAMESTART_CHAR_RE_SRC + String.raw`\u{B7}\u{0300}-\u{036F}\u{203F}-\u{2040}0-9.-`;
const xmlNamestartCharRe = new RegExp(`[${XML_NAMESTART_CHAR_RE_SRC}]`, "u");
const xmlNameCharRe = new RegExp(`[${XML_NAME_CHAR_RE_SRC}]`, "u");
export class Element extends Node {
  tagName;
  localName;
  attributes;
  #datasetProxy;
  #currentId;
  #classList;
  constructor(tagName, parentNode, attributes, key){
    super(tagName, NodeType.ELEMENT_NODE, parentNode, key);
    this.tagName = tagName;
    this.attributes = new NamedNodeMap(this, (attribute, value)=>{
      if (value === null) {
        value = "";
      }
      switch(attribute){
        case "class":
          this.#classList.value = value;
          break;
        case "id":
          this.#currentId = value;
          break;
      }
    }, CTOR_KEY);
    this.#datasetProxy = null;
    this.#currentId = "";
    this.#classList = new DOMTokenList((className)=>{
      if (this.hasAttribute("class") || className !== "") {
        this.attributes[setNamedNodeMapValueSym]("class", className);
      }
    }, CTOR_KEY);
    for (const attr of attributes){
      this.setAttribute(attr[0], attr[1]);
      switch(attr[0]){
        case "class":
          this.#classList.value = attr[1];
          break;
        case "id":
          this.#currentId = attr[1];
          break;
      }
    }
    this.tagName = this.nodeName = tagName.toUpperCase();
    this.localName = tagName.toLowerCase();
  }
  _shallowClone() {
    // FIXME: This attribute copying needs to also be fixed in other
    // elements that override _shallowClone like <template>
    const attributes = [];
    for (const attribute of this.getAttributeNames()){
      attributes.push([
        attribute,
        this.getAttribute(attribute)
      ]);
    }
    return new Element(this.nodeName, null, attributes, CTOR_KEY);
  }
  get childElementCount() {
    return this._getChildNodesMutator().elementsView().length;
  }
  get className() {
    return this.getAttribute("class") ?? "";
  }
  set className(className) {
    this.setAttribute("class", className);
    this.#classList.value = className;
  }
  get classList() {
    return this.#classList;
  }
  get outerHTML() {
    return getOuterOrInnerHtml(this, true);
  }
  set outerHTML(html) {
    if (this.parentNode) {
      const { parentElement, parentNode } = this;
      let contextLocalName = parentElement?.localName;
      switch(parentNode.nodeType){
        case NodeType.DOCUMENT_NODE:
          {
            throw new DOMException("Modifications are not allowed for this document");
          }
        // setting outerHTML, step 4. Document Fragment
        // ref: https://w3c.github.io/DOM-Parsing/#dom-element-outerhtml
        case NodeType.DOCUMENT_FRAGMENT_NODE:
          {
            contextLocalName = "body";
          // fall-through
          }
        default:
          {
            const { childNodes: newChildNodes } = fragmentNodesFromString(html, contextLocalName).childNodes[0];
            const mutator = parentNode._getChildNodesMutator();
            const insertionIndex = mutator.indexOf(this);
            for(let i = newChildNodes.length - 1; i >= 0; i--){
              const child = newChildNodes[i];
              mutator.splice(insertionIndex, 0, child);
              child._setParent(parentNode);
              child._setOwnerDocument(parentNode.ownerDocument);
            }
            this.remove();
          }
      }
    }
  }
  get innerHTML() {
    return getOuterOrInnerHtml(this, false);
  }
  set innerHTML(html) {
    // Remove all children
    for (const child of this.childNodes){
      child._setParent(null);
    }
    const mutator = this._getChildNodesMutator();
    mutator.splice(0, this.childNodes.length);
    // Parse HTML into new children
    if (html.length) {
      const parsed = fragmentNodesFromString(html, this.localName);
      for (const child of parsed.childNodes[0].childNodes){
        mutator.push(child);
      }
      for (const child of this.childNodes){
        child._setParent(this);
        child._setOwnerDocument(this.ownerDocument);
      }
    }
  }
  get innerText() {
    return this.textContent;
  }
  set innerText(text) {
    this.textContent = text;
  }
  get children() {
    return this._getChildNodesMutator().elementsView();
  }
  get id() {
    return this.#currentId || "";
  }
  set id(id) {
    this.setAttribute("id", this.#currentId = id);
  }
  get dataset() {
    if (this.#datasetProxy) {
      return this.#datasetProxy;
    }
    this.#datasetProxy = new Proxy({}, {
      get: (_target, property, _receiver)=>{
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          return this.getAttribute(attributeName) ?? undefined;
        }
        return undefined;
      },
      set: (_target, property, value, _receiver)=>{
        if (typeof property === "string") {
          let attributeName = "data-";
          let prevChar = "";
          for (const char of property){
            // Step 1. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
            if (prevChar === "-" && lowerCaseCharRe.test(char)) {
              throw new DOMException("An invalid or illegal string was specified");
            }
            // Step 4. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
            if (!xmlNameCharRe.test(char)) {
              throw new DOMException("String contains an invalid character");
            }
            // Step 2. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
            if (upperCaseCharRe.test(char)) {
              attributeName += "-";
            }
            attributeName += char.toLowerCase();
            prevChar = char;
          }
          this.setAttribute(attributeName, String(value));
        }
        return true;
      },
      deleteProperty: (_target, property)=>{
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          this.removeAttribute(attributeName);
        }
        return true;
      },
      ownKeys: (_target)=>{
        return this.getAttributeNames().flatMap((attributeName)=>{
          if (attributeName.startsWith?.("data-")) {
            return [
              getDatasetJavascriptName(attributeName)
            ];
          } else {
            return [];
          }
        });
      },
      getOwnPropertyDescriptor: (_target, property)=>{
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          if (this.hasAttribute(attributeName)) {
            return {
              writable: true,
              enumerable: true,
              configurable: true
            };
          }
        }
        return undefined;
      },
      has: (_target, property)=>{
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          return this.hasAttribute(attributeName);
        }
        return false;
      }
    });
    return this.#datasetProxy;
  }
  getAttributeNames() {
    return this.attributes[getNamedNodeMapAttrNamesSym]();
  }
  getAttribute(name) {
    return this.attributes[getNamedNodeMapValueSym](name.toLowerCase()) ?? null;
  }
  setAttribute(rawName, value) {
    const name = String(rawName?.toLowerCase());
    const strValue = String(value);
    this.attributes[setNamedNodeMapValueSym](name, strValue);
    if (name === "id") {
      this.#currentId = strValue;
    } else if (name === "class") {
      this.#classList.value = strValue;
    }
  }
  removeAttribute(rawName) {
    const name = String(rawName?.toLowerCase());
    this.attributes[removeNamedNodeMapAttrSym](name);
    if (name === "class") {
      this.#classList.value = "";
    }
  }
  hasAttribute(name) {
    return this.attributes[getNamedNodeMapValueSym](String(name?.toLowerCase())) !== undefined;
  }
  hasAttributeNS(_namespace, name) {
    // TODO: Use namespace
    return this.attributes[getNamedNodeMapValueSym](String(name?.toLowerCase())) !== undefined;
  }
  replaceWith(...nodes) {
    this._replaceWith(...nodes);
  }
  remove() {
    this._remove();
  }
  append(...nodes) {
    const mutator = this._getChildNodesMutator();
    mutator.push(...nodesAndTextNodes(nodes, this));
  }
  prepend(...nodes) {
    const mutator = this._getChildNodesMutator();
    mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
  }
  before(...nodes) {
    if (this.parentNode) {
      insertBeforeAfter(this, nodes, true);
    }
  }
  after(...nodes) {
    if (this.parentNode) {
      insertBeforeAfter(this, nodes, false);
    }
  }
  get firstElementChild() {
    const elements = this._getChildNodesMutator().elementsView();
    return elements[0] ?? null;
  }
  get lastElementChild() {
    const elements = this._getChildNodesMutator().elementsView();
    return elements[elements.length - 1] ?? null;
  }
  get nextElementSibling() {
    const parent = this.parentNode;
    if (!parent) {
      return null;
    }
    const mutator = parent._getChildNodesMutator();
    const index = mutator.indexOfElementsView(this);
    const elements = mutator.elementsView();
    return elements[index + 1] ?? null;
  }
  get previousElementSibling() {
    const parent = this.parentNode;
    if (!parent) {
      return null;
    }
    const mutator = parent._getChildNodesMutator();
    const index = mutator.indexOfElementsView(this);
    const elements = mutator.elementsView();
    return elements[index - 1] ?? null;
  }
  querySelector(selectors) {
    if (!this.ownerDocument) {
      throw new Error("Element must have an owner document");
    }
    return this.ownerDocument._nwapi.first(selectors, this);
  }
  querySelectorAll(selectors) {
    if (!this.ownerDocument) {
      throw new Error("Element must have an owner document");
    }
    const nodeList = new NodeList();
    const mutator = nodeList[nodeListMutatorSym]();
    for (const match of this.ownerDocument._nwapi.select(selectors, this)){
      mutator.push(match);
    }
    return nodeList;
  }
  matches(selectorString) {
    return this.ownerDocument._nwapi.match(selectorString, this);
  }
  closest(selectorString) {
    const { match } = this.ownerDocument._nwapi; // See note below
    // deno-lint-ignore no-this-alias
    let el = this;
    do {
      // Note: Not using `el.matches(selectorString)` because on a browser if you override
      // `matches`, you *don't* see it being used by `closest`.
      if (match(selectorString, el)) {
        return el;
      }
      el = el.parentElement;
    }while (el !== null)
    return null;
  }
  // TODO: DRY!!!
  getElementById(id) {
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if (child.id === id) {
          return child;
        }
        const search = child.getElementById(id);
        if (search) {
          return search;
        }
      }
    }
    return null;
  }
  getElementsByTagName(tagName) {
    const fixCaseTagName = tagName.toUpperCase();
    if (fixCaseTagName === "*") {
      return this._getElementsByTagNameWildcard([]);
    } else {
      return this._getElementsByTagName(tagName.toUpperCase(), []);
    }
  }
  _getElementsByTagNameWildcard(search) {
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        search.push(child);
        child._getElementsByTagNameWildcard(search);
      }
    }
    return search;
  }
  _getElementsByTagName(tagName, search) {
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if (child.tagName === tagName) {
          search.push(child);
        }
        child._getElementsByTagName(tagName, search);
      }
    }
    return search;
  }
  getElementsByClassName(className) {
    return getElementsByClassName(this, className, []);
  }
  getElementsByTagNameNS(_namespace, localName) {
    // TODO: Use namespace
    return this.getElementsByTagName(localName);
  }
}
UtilTypes.Element = Element;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40NS9zcmMvZG9tL2VsZW1lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuaW1wb3J0IHsgZnJhZ21lbnROb2Rlc0Zyb21TdHJpbmcgfSBmcm9tIFwiLi4vZGVzZXJpYWxpemUudHNcIjtcbmltcG9ydCB7IE5vZGUsIG5vZGVzQW5kVGV4dE5vZGVzLCBOb2RlVHlwZSB9IGZyb20gXCIuL25vZGUudHNcIjtcbmltcG9ydCB7IE5vZGVMaXN0LCBub2RlTGlzdE11dGF0b3JTeW0gfSBmcm9tIFwiLi9ub2RlLWxpc3QudHNcIjtcbmltcG9ydCB7IEhUTUxDb2xsZWN0aW9uIH0gZnJvbSBcIi4vaHRtbC1jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQge1xuICBnZXREYXRhc2V0SHRtbEF0dHJOYW1lLFxuICBnZXREYXRhc2V0SmF2YXNjcmlwdE5hbWUsXG4gIGdldEVsZW1lbnRzQnlDbGFzc05hbWUsXG4gIGdldE91dGVyT3JJbm5lckh0bWwsXG4gIGluc2VydEJlZm9yZUFmdGVyLFxuICBsb3dlckNhc2VDaGFyUmUsXG4gIHVwcGVyQ2FzZUNoYXJSZSxcbn0gZnJvbSBcIi4vdXRpbHMudHNcIjtcbmltcG9ydCBVdGlsVHlwZXMgZnJvbSBcIi4vdXRpbHMtdHlwZXMudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBET01Ub2tlbkxpc3Qge1xuICBbaW5kZXg6IG51bWJlcl06IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIERPTVRva2VuTGlzdCB7XG4gICNfdmFsdWUgPSBcIlwiO1xuICBnZXQgI3ZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLiNfdmFsdWU7XG4gIH1cbiAgc2V0ICN2YWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nLFxuICApIHtcbiAgICB0aGlzLiNfdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLiNvbkNoYW5nZSh2YWx1ZSk7XG4gIH1cbiAgI3NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAjb25DaGFuZ2U6IChjbGFzc05hbWU6IHN0cmluZykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBvbkNoYW5nZTogKGNsYXNzTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIGtleTogdHlwZW9mIENUT1JfS0VZLFxuICApIHtcbiAgICBpZiAoa2V5ICE9PSBDVE9SX0tFWSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgY29uc3RydWN0b3JcIik7XG4gICAgfVxuICAgIHRoaXMuI29uQ2hhbmdlID0gb25DaGFuZ2U7XG4gIH1cblxuICBzdGF0aWMgI2ludmFsaWRUb2tlbihcbiAgICB0b2tlbjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gdG9rZW4gPT09IFwiXCIgfHwgL1tcXHRcXG5cXGZcXHIgXS8udGVzdCh0b2tlbik7XG4gIH1cblxuICAjc2V0SW5kaWNlcygpIHtcbiAgICBjb25zdCBjbGFzc2VzID0gQXJyYXkuZnJvbSh0aGlzLiNzZXQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGNsYXNzZXNbaV07XG4gICAgfVxuICB9XG5cbiAgc2V0IHZhbHVlKFxuICAgIGlucHV0OiBzdHJpbmcsXG4gICkge1xuICAgIHRoaXMuI3ZhbHVlID0gaW5wdXQ7XG4gICAgdGhpcy4jc2V0ID0gbmV3IFNldChcbiAgICAgIGlucHV0XG4gICAgICAgIC50cmltKClcbiAgICAgICAgLnNwbGl0KC9bXFx0XFxuXFxmXFxyXFxzXSsvZylcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKSxcbiAgICApO1xuICAgIHRoaXMuI3NldEluZGljZXMoKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jX3ZhbHVlO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy4jc2V0LnNpemU7XG4gIH1cblxuICAqZW50cmllcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFtudW1iZXIsIHN0cmluZ10+IHtcbiAgICBjb25zdCBhcnJheSA9IEFycmF5LmZyb20odGhpcy4jc2V0KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB5aWVsZCBbaSwgYXJyYXlbaV1dO1xuICAgIH1cbiAgfVxuXG4gICp2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICB5aWVsZCogdGhpcy4jc2V0LnZhbHVlcygpO1xuICB9XG5cbiAgKmtleXMoKTogSXRlcmFibGVJdGVyYXRvcjxudW1iZXI+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuI3NldC5zaXplOyBpKyspIHtcbiAgICAgIHlpZWxkIGk7XG4gICAgfVxuICB9XG5cbiAgKltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgeWllbGQqIHRoaXMuI3NldC52YWx1ZXMoKTtcbiAgfVxuXG4gIGl0ZW0oXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKSB7XG4gICAgaW5kZXggPSBOdW1iZXIoaW5kZXgpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4oaW5kZXgpIHx8IGluZGV4ID09PSBJbmZpbml0eSkgaW5kZXggPSAwO1xuICAgIHJldHVybiB0aGlzW01hdGgudHJ1bmMoaW5kZXgpICUgMiAqKiAzMl0gPz8gbnVsbDtcbiAgfVxuXG4gIGNvbnRhaW5zKFxuICAgIGVsZW1lbnQ6IHN0cmluZyxcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMuI3NldC5oYXMoZWxlbWVudCk7XG4gIH1cblxuICBhZGQoXG4gICAgLi4uZWxlbWVudHM6IEFycmF5PHN0cmluZz5cbiAgKSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICBpZiAoRE9NVG9rZW5MaXN0LiNpbnZhbGlkVG9rZW4oZWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgICAgICBcIkZhaWxlZCB0byBleGVjdXRlICdhZGQnIG9uICdET01Ub2tlbkxpc3QnOiBUaGUgdG9rZW4gcHJvdmlkZWQgbXVzdCBub3QgYmUgZW1wdHkuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCB7IHNpemUgfSA9IHRoaXMuI3NldDtcbiAgICAgIHRoaXMuI3NldC5hZGQoZWxlbWVudCk7XG4gICAgICBpZiAoc2l6ZSA8IHRoaXMuI3NldC5zaXplKSB7XG4gICAgICAgIHRoaXNbc2l6ZV0gPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiN1cGRhdGVDbGFzc1N0cmluZygpO1xuICB9XG5cbiAgcmVtb3ZlKFxuICAgIC4uLmVsZW1lbnRzOiBBcnJheTxzdHJpbmc+XG4gICkge1xuICAgIGNvbnN0IHsgc2l6ZSB9ID0gdGhpcy4jc2V0O1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgaWYgKERPTVRva2VuTGlzdC4jaW52YWxpZFRva2VuKGVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgICAgXCJGYWlsZWQgdG8gZXhlY3V0ZSAncmVtb3ZlJyBvbiAnRE9NVG9rZW5MaXN0JzogVGhlIHRva2VuIHByb3ZpZGVkIG11c3Qgbm90IGJlIGVtcHR5LlwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy4jc2V0LmRlbGV0ZShlbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKHNpemUgIT09IHRoaXMuI3NldC5zaXplKSB7XG4gICAgICBmb3IgKGxldCBpID0gdGhpcy4jc2V0LnNpemU7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbaV07XG4gICAgICB9XG4gICAgICB0aGlzLiNzZXRJbmRpY2VzKCk7XG4gICAgfVxuICAgIHRoaXMuI3VwZGF0ZUNsYXNzU3RyaW5nKCk7XG4gIH1cblxuICByZXBsYWNlKFxuICAgIG9sZFRva2VuOiBzdHJpbmcsXG4gICAgbmV3VG9rZW46IHN0cmluZyxcbiAgKSB7XG4gICAgaWYgKFtvbGRUb2tlbiwgbmV3VG9rZW5dLnNvbWUoKHYpID0+IERPTVRva2VuTGlzdC4jaW52YWxpZFRva2VuKHYpKSkge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgICAgXCJGYWlsZWQgdG8gZXhlY3V0ZSAncmVwbGFjZScgb24gJ0RPTVRva2VuTGlzdCc6IFRoZSB0b2tlbiBwcm92aWRlZCBtdXN0IG5vdCBiZSBlbXB0eS5cIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghdGhpcy4jc2V0LmhhcyhvbGRUb2tlbikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy4jc2V0LmhhcyhuZXdUb2tlbikpIHtcbiAgICAgIHRoaXMucmVtb3ZlKG9sZFRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jc2V0LmRlbGV0ZShvbGRUb2tlbik7XG4gICAgICB0aGlzLiNzZXQuYWRkKG5ld1Rva2VuKTtcbiAgICAgIHRoaXMuI3NldEluZGljZXMoKTtcbiAgICAgIHRoaXMuI3VwZGF0ZUNsYXNzU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc3VwcG9ydHMoKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIHRvZ2dsZShcbiAgICBlbGVtZW50OiBzdHJpbmcsXG4gICAgZm9yY2U/OiBib29sZWFuLFxuICApIHtcbiAgICBpZiAoZm9yY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgb3BlcmF0aW9uID0gZm9yY2UgPyBcImFkZFwiIDogXCJyZW1vdmVcIjtcbiAgICAgIHRoaXNbb3BlcmF0aW9uXShlbGVtZW50KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY29udGFpbnMgPSB0aGlzLmNvbnRhaW5zKGVsZW1lbnQpO1xuICAgICAgY29uc3Qgb3BlcmF0aW9uID0gY29udGFpbnMgPyBcInJlbW92ZVwiIDogXCJhZGRcIjtcbiAgICAgIHRoaXNbb3BlcmF0aW9uXShlbGVtZW50KTtcbiAgICAgIHJldHVybiAhY29udGFpbnM7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaChcbiAgICBjYWxsYmFjazogKHZhbHVlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGxpc3Q6IERPTVRva2VuTGlzdCkgPT4gdm9pZCxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbaSwgdmFsdWVdIG9mIHRoaXMuZW50cmllcygpKSB7XG4gICAgICBjYWxsYmFjayh2YWx1ZSwgaSwgdGhpcyk7XG4gICAgfVxuICB9XG5cbiAgI3VwZGF0ZUNsYXNzU3RyaW5nKCkge1xuICAgIHRoaXMuI3ZhbHVlID0gQXJyYXkuZnJvbSh0aGlzLiNzZXQpLmpvaW4oXCIgXCIpO1xuICB9XG59XG5cbmNvbnN0IHNldE5hbWVkTm9kZU1hcE93bmVyRWxlbWVudFN5bSA9IFN5bWJvbCgpO1xuY29uc3Qgc2V0QXR0clZhbHVlU3ltID0gU3ltYm9sKCk7XG5leHBvcnQgY2xhc3MgQXR0ciBleHRlbmRzIE5vZGUge1xuICAjbmFtZWROb2RlTWFwOiBOYW1lZE5vZGVNYXAgfCBudWxsID0gbnVsbDtcbiAgI25hbWUgPSBcIlwiO1xuICAjdmFsdWUgPSBcIlwiO1xuICAjb3duZXJFbGVtZW50OiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbWFwOiBOYW1lZE5vZGVNYXAgfCBudWxsLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIGtleTogdHlwZW9mIENUT1JfS0VZLFxuICApIHtcbiAgICBpZiAoa2V5ICE9PSBDVE9SX0tFWSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgY29uc3RydWN0b3JcIik7XG4gICAgfVxuICAgIHN1cGVyKG5hbWUsIE5vZGVUeXBlLkFUVFJJQlVURV9OT0RFLCBudWxsLCBDVE9SX0tFWSk7XG5cbiAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICB0aGlzLiN2YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuI25hbWVkTm9kZU1hcCA9IG1hcDtcbiAgfVxuXG4gIFtzZXROYW1lZE5vZGVNYXBPd25lckVsZW1lbnRTeW1dKG93bmVyRWxlbWVudDogRWxlbWVudCB8IG51bGwpIHtcbiAgICB0aGlzLiNvd25lckVsZW1lbnQgPSBvd25lckVsZW1lbnQ7XG4gICAgdGhpcy4jbmFtZWROb2RlTWFwID0gb3duZXJFbGVtZW50Py5hdHRyaWJ1dGVzID8/IG51bGw7XG5cbiAgICBpZiAob3duZXJFbGVtZW50KSB7XG4gICAgICB0aGlzLl9zZXRPd25lckRvY3VtZW50KG93bmVyRWxlbWVudC5vd25lckRvY3VtZW50KTtcbiAgICB9XG4gIH1cblxuICBbc2V0QXR0clZhbHVlU3ltXSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy4jdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIG92ZXJyaWRlIF9zaGFsbG93Q2xvbmUoKTogQXR0ciB7XG4gICAgY29uc3QgbmV3QXR0ciA9IG5ldyBBdHRyKG51bGwsIHRoaXMuI25hbWUsIHRoaXMuI3ZhbHVlLCBDVE9SX0tFWSk7XG4gICAgbmV3QXR0ci5fc2V0T3duZXJEb2N1bWVudCh0aGlzLm93bmVyRG9jdW1lbnQpO1xuICAgIHJldHVybiBuZXdBdHRyO1xuICB9XG5cbiAgb3ZlcnJpZGUgY2xvbmVOb2RlKCk6IEF0dHIge1xuICAgIHJldHVybiBzdXBlci5jbG9uZU5vZGUoKSBhcyBBdHRyO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXBwZW5kQ2hpbGQoKTogTm9kZSB7XG4gICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkNhbm5vdCBhZGQgY2hpbGRyZW4gdG8gYW4gQXR0cmlidXRlXCIpO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVwbGFjZUNoaWxkKCk6IE5vZGUge1xuICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJDYW5ub3QgYWRkIGNoaWxkcmVuIHRvIGFuIEF0dHJpYnV0ZVwiKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGluc2VydEJlZm9yZSgpOiBOb2RlIHtcbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiQ2Fubm90IGFkZCBjaGlsZHJlbiB0byBhbiBBdHRyaWJ1dGVcIik7XG4gIH1cblxuICBvdmVycmlkZSByZW1vdmVDaGlsZCgpOiBOb2RlIHtcbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgXCJUaGUgbm9kZSB0byBiZSByZW1vdmVkIGlzIG5vdCBhIGNoaWxkIG9mIHRoaXMgbm9kZVwiLFxuICAgICk7XG4gIH1cblxuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jbmFtZTtcbiAgfVxuXG4gIGdldCBsb2NhbE5hbWUoKSB7XG4gICAgLy8gVE9ETzogV2hlbiB3ZSBtYWtlIG5hbWVzcGFjZXMgYSB0aGluZyB0aGlzIG5lZWRzXG4gICAgLy8gdG8gYmUgdXBkYXRlZFxuICAgIHJldHVybiB0aGlzLiNuYW1lO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI3ZhbHVlO1xuICB9XG5cbiAgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLiN2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG5cbiAgICBpZiAodGhpcy4jbmFtZWROb2RlTWFwKSB7XG4gICAgICB0aGlzLiNuYW1lZE5vZGVNYXBbc2V0TmFtZWROb2RlTWFwVmFsdWVTeW1dKFxuICAgICAgICB0aGlzLiNuYW1lLFxuICAgICAgICB0aGlzLiN2YWx1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IG93bmVyRWxlbWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3duZXJFbGVtZW50ID8/IG51bGw7XG4gIH1cblxuICBnZXQgc3BlY2lmaWVkKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gVE9ET1xuICBnZXQgcHJlZml4KCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmFtZWROb2RlTWFwIHtcbiAgW2luZGV4OiBudW1iZXJdOiBBdHRyO1xufVxuXG5jb25zdCBzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bSA9IFN5bWJvbCgpO1xuY29uc3QgZ2V0TmFtZWROb2RlTWFwVmFsdWVTeW0gPSBTeW1ib2woKTtcbmNvbnN0IGdldE5hbWVkTm9kZU1hcEF0dHJOYW1lc1N5bSA9IFN5bWJvbCgpO1xuY29uc3QgZ2V0TmFtZWROb2RlTWFwQXR0ck5vZGVTeW0gPSBTeW1ib2woKTtcbmNvbnN0IHJlbW92ZU5hbWVkTm9kZU1hcEF0dHJTeW0gPSBTeW1ib2woKTtcbmV4cG9ydCBjbGFzcyBOYW1lZE5vZGVNYXAge1xuICBzdGF0aWMgI2luZGV4ZWRBdHRyQWNjZXNzID0gZnVuY3Rpb24gKFxuICAgIHRoaXM6IE5hbWVkTm9kZU1hcCxcbiAgICBtYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKTogQXR0ciB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGluZGV4ICsgMSA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IE9iamVjdFxuICAgICAgLmtleXMobWFwKVxuICAgICAgLmZpbHRlcigoYXR0cmlidXRlKSA9PiBtYXBbYXR0cmlidXRlXSAhPT0gdW5kZWZpbmVkKVtpbmRleF1cbiAgICAgID8uc2xpY2UoMSk7IC8vIFJlbW92ZSBcImFcIiBmb3Igc2FmZUF0dHJOYW1lXG4gICAgcmV0dXJuIHRoaXNbZ2V0TmFtZWROb2RlTWFwQXR0ck5vZGVTeW1dKGF0dHJpYnV0ZSk7XG4gIH07XG4gICNvbkF0dHJOb2RlQ2hhbmdlOiAoYXR0cjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBvd25lckVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgb25BdHRyTm9kZUNoYW5nZTogKGF0dHI6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHZvaWQsXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIGlmIChrZXkgIT09IENUT1JfS0VZKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBjb25zdHJ1Y3Rvci5cIik7XG4gICAgfVxuICAgIHRoaXMuI293bmVyRWxlbWVudCA9IG93bmVyRWxlbWVudDtcbiAgICB0aGlzLiNvbkF0dHJOb2RlQ2hhbmdlID0gb25BdHRyTm9kZUNoYW5nZTtcbiAgfVxuXG4gICNhdHRyTm9kZUNhY2hlOiBSZWNvcmQ8c3RyaW5nLCBBdHRyIHwgdW5kZWZpbmVkPiA9IHt9O1xuICAjbWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+ID0ge307XG4gICNsZW5ndGggPSAwO1xuICAjY2FwYWNpdHkgPSAwO1xuICAjb3duZXJFbGVtZW50OiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgW2dldE5hbWVkTm9kZU1hcEF0dHJOb2RlU3ltXShhdHRyaWJ1dGU6IHN0cmluZyk6IEF0dHIge1xuICAgIGNvbnN0IHNhZmVBdHRyTmFtZSA9IFwiYVwiICsgYXR0cmlidXRlO1xuICAgIGxldCBhdHRyTm9kZSA9IHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXTtcbiAgICBpZiAoIWF0dHJOb2RlKSB7XG4gICAgICBhdHRyTm9kZSA9IHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXSA9IG5ldyBBdHRyKFxuICAgICAgICB0aGlzLFxuICAgICAgICBhdHRyaWJ1dGUsXG4gICAgICAgIHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdIGFzIHN0cmluZyxcbiAgICAgICAgQ1RPUl9LRVksXG4gICAgICApO1xuICAgICAgYXR0ck5vZGVbc2V0TmFtZWROb2RlTWFwT3duZXJFbGVtZW50U3ltXSh0aGlzLiNvd25lckVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBhdHRyTm9kZTtcbiAgfVxuXG4gIFtnZXROYW1lZE5vZGVNYXBBdHRyTmFtZXNTeW1dKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLiNtYXApKSB7XG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lcy5wdXNoKG5hbWUuc2xpY2UoMSkpOyAvLyBSZW1vdmUgXCJhXCIgZm9yIHNhZmVBdHRyTmFtZVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuYW1lcztcbiAgfVxuXG4gIFtnZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHNhZmVBdHRyTmFtZSA9IFwiYVwiICsgYXR0cmlidXRlO1xuICAgIHJldHVybiB0aGlzLiNtYXBbc2FmZUF0dHJOYW1lXTtcbiAgfVxuXG4gIFtzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oYXR0cmlidXRlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIGJ1YmJsZSA9IGZhbHNlKSB7XG4gICAgY29uc3Qgc2FmZUF0dHJOYW1lID0gXCJhXCIgKyBhdHRyaWJ1dGU7XG4gICAgaWYgKHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI2xlbmd0aCsrO1xuXG4gICAgICBpZiAodGhpcy4jbGVuZ3RoID4gdGhpcy4jY2FwYWNpdHkpIHtcbiAgICAgICAgdGhpcy4jY2FwYWNpdHkgPSB0aGlzLiNsZW5ndGg7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy4jY2FwYWNpdHkgLSAxO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgU3RyaW5nKHRoaXMuI2NhcGFjaXR5IC0gMSksIHtcbiAgICAgICAgICBnZXQ6IE5hbWVkTm9kZU1hcC4jaW5kZXhlZEF0dHJBY2Nlc3MuYmluZCh0aGlzLCB0aGlzLiNtYXAsIGluZGV4KSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLiNhdHRyTm9kZUNhY2hlW3NhZmVBdHRyTmFtZV0pIHtcbiAgICAgIHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXSFbc2V0QXR0clZhbHVlU3ltXSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy4jbWFwW3NhZmVBdHRyTmFtZV0gPSB2YWx1ZTtcblxuICAgIGlmIChidWJibGUpIHtcbiAgICAgIHRoaXMuI29uQXR0ck5vZGVDaGFuZ2UoYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGF0dHJpYnV0ZSBpcyByZW1vdmVkIGZyb21cbiAgICogYW4gZWxlbWVudFxuICAgKi9cbiAgW3JlbW92ZU5hbWVkTm9kZU1hcEF0dHJTeW1dKGF0dHJpYnV0ZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgc2FmZUF0dHJOYW1lID0gXCJhXCIgKyBhdHRyaWJ1dGU7XG4gICAgaWYgKHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI2xlbmd0aC0tO1xuICAgICAgdGhpcy4jbWFwW3NhZmVBdHRyTmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLiNvbkF0dHJOb2RlQ2hhbmdlKGF0dHJpYnV0ZSwgbnVsbCk7XG5cbiAgICAgIGNvbnN0IGF0dHJOb2RlID0gdGhpcy4jYXR0ck5vZGVDYWNoZVtzYWZlQXR0ck5hbWVdO1xuICAgICAgaWYgKGF0dHJOb2RlKSB7XG4gICAgICAgIGF0dHJOb2RlW3NldE5hbWVkTm9kZU1hcE93bmVyRWxlbWVudFN5bV0obnVsbCk7XG4gICAgICAgIHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAqW1N5bWJvbC5pdGVyYXRvcl0oKTogR2VuZXJhdG9yPEF0dHI+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHlpZWxkIHRoaXNbaV07XG4gICAgfVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy4jbGVuZ3RoO1xuICB9XG5cbiAgLy8gRklYTUU6IFRoaXMgbWV0aG9kIHNob3VsZCBhY2NlcHQgYW55dGhpbmcgYW5kIGJhc2ljYWxseVxuICAvLyBjb2VyY2UgYW55IG5vbiBudW1iZXJzIChhbmQgSW5maW5pdHkvLUluZmluaXR5KSBpbnRvIDBcbiAgaXRlbShpbmRleDogbnVtYmVyKTogQXR0ciB8IG51bGwge1xuICAgIGlmIChpbmRleCA+PSB0aGlzLiNsZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzW2luZGV4XTtcbiAgfVxuXG4gIGdldE5hbWVkSXRlbShhdHRyaWJ1dGU6IHN0cmluZyk6IEF0dHIgfCBudWxsIHtcbiAgICBjb25zdCBzYWZlQXR0ck5hbWUgPSBcImFcIiArIGF0dHJpYnV0ZTtcbiAgICBpZiAodGhpcy4jbWFwW3NhZmVBdHRyTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXNbZ2V0TmFtZWROb2RlTWFwQXR0ck5vZGVTeW1dKGF0dHJpYnV0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBzZXROYW1lZEl0ZW0oYXR0ck5vZGU6IEF0dHIpIHtcbiAgICBpZiAoYXR0ck5vZGUub3duZXJFbGVtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiQXR0cmlidXRlIGFscmVhZHkgaW4gdXNlXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHNhZmVBdHRyTmFtZSA9IFwiYVwiICsgYXR0ck5vZGUubmFtZTtcbiAgICBjb25zdCBwcmV2aW91c0F0dHIgPSB0aGlzLiNhdHRyTm9kZUNhY2hlW3NhZmVBdHRyTmFtZV07XG4gICAgaWYgKHByZXZpb3VzQXR0cikge1xuICAgICAgcHJldmlvdXNBdHRyW3NldE5hbWVkTm9kZU1hcE93bmVyRWxlbWVudFN5bV0obnVsbCk7XG4gICAgICB0aGlzLiNtYXBbc2FmZUF0dHJOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBhdHRyTm9kZVtzZXROYW1lZE5vZGVNYXBPd25lckVsZW1lbnRTeW1dKHRoaXMuI293bmVyRWxlbWVudCk7XG4gICAgdGhpcy4jYXR0ck5vZGVDYWNoZVtzYWZlQXR0ck5hbWVdID0gYXR0ck5vZGU7XG4gICAgdGhpc1tzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oYXR0ck5vZGUubmFtZSwgYXR0ck5vZGUudmFsdWUsIHRydWUpO1xuICB9XG5cbiAgcmVtb3ZlTmFtZWRJdGVtKGF0dHJpYnV0ZTogc3RyaW5nKTogQXR0ciB7XG4gICAgY29uc3Qgc2FmZUF0dHJOYW1lID0gXCJhXCIgKyBhdHRyaWJ1dGU7XG4gICAgaWYgKHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGF0dHJOb2RlID0gdGhpc1tnZXROYW1lZE5vZGVNYXBBdHRyTm9kZVN5bV0oYXR0cmlidXRlKTtcbiAgICAgIHRoaXNbcmVtb3ZlTmFtZWROb2RlTWFwQXR0clN5bV0oYXR0cmlidXRlKTtcbiAgICAgIHJldHVybiBhdHRyTm9kZTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiTm9kZSB3YXMgbm90IGZvdW5kXCIpO1xuICB9XG59XG5cbmNvbnN0IFhNTF9OQU1FU1RBUlRfQ0hBUl9SRV9TUkMgPSBcIjpBLVphLXpfXCIgK1xuICBTdHJpbmcucmF3YFxcdXtDMH0tXFx1e0Q2fVxcdXtEOH0tXFx1e0Y2fVxcdXtGOH0tXFx1ezJGRn1cXHV7MzcwfS1cXHV7MzdEfWAgK1xuICBTdHJpbmdcbiAgICAucmF3YFxcdXszN0Z9LVxcdXsxRkZGfVxcdXsyMDBDfS1cXHV7MjAwRH1cXHV7MjA3MH0tXFx1ezIxOEZ9XFx1ezJDMDB9LVxcdXsyRkVGfWAgK1xuICBTdHJpbmdcbiAgICAucmF3YFxcdXszMDAxfS1cXHV7RDdGRn1cXHV7RjkwMH0tXFx1e0ZEQ0Z9XFx1e0ZERjB9LVxcdXtGRkZEfVxcdXsxMDAwMH0tXFx1e0VGRkZGfWA7XG5jb25zdCBYTUxfTkFNRV9DSEFSX1JFX1NSQyA9IFhNTF9OQU1FU1RBUlRfQ0hBUl9SRV9TUkMgK1xuICBTdHJpbmcucmF3YFxcdXtCN31cXHV7MDMwMH0tXFx1ezAzNkZ9XFx1ezIwM0Z9LVxcdXsyMDQwfTAtOS4tYDtcbmNvbnN0IHhtbE5hbWVzdGFydENoYXJSZSA9IG5ldyBSZWdFeHAoYFske1hNTF9OQU1FU1RBUlRfQ0hBUl9SRV9TUkN9XWAsIFwidVwiKTtcbmNvbnN0IHhtbE5hbWVDaGFyUmUgPSBuZXcgUmVnRXhwKGBbJHtYTUxfTkFNRV9DSEFSX1JFX1NSQ31dYCwgXCJ1XCIpO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudCBleHRlbmRzIE5vZGUge1xuICBsb2NhbE5hbWU6IHN0cmluZztcbiAgYXR0cmlidXRlcyA9IG5ldyBOYW1lZE5vZGVNYXAodGhpcywgKGF0dHJpYnV0ZSwgdmFsdWUpID0+IHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHZhbHVlID0gXCJcIjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICAgIHRoaXMuI2NsYXNzTGlzdC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJpZFwiOlxuICAgICAgICB0aGlzLiNjdXJyZW50SWQgPSB2YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9LCBDVE9SX0tFWSk7XG5cbiAgI2RhdGFzZXRQcm94eTogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPiB8IG51bGwgPSBudWxsO1xuICAjY3VycmVudElkID0gXCJcIjtcbiAgI2NsYXNzTGlzdCA9IG5ldyBET01Ub2tlbkxpc3QoXG4gICAgKGNsYXNzTmFtZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaGFzQXR0cmlidXRlKFwiY2xhc3NcIikgfHwgY2xhc3NOYW1lICE9PSBcIlwiKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1tzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgQ1RPUl9LRVksXG4gICk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHRhZ05hbWU6IHN0cmluZyxcbiAgICBwYXJlbnROb2RlOiBOb2RlIHwgbnVsbCxcbiAgICBhdHRyaWJ1dGVzOiBbc3RyaW5nLCBzdHJpbmddW10sXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgdGFnTmFtZSxcbiAgICAgIE5vZGVUeXBlLkVMRU1FTlRfTk9ERSxcbiAgICAgIHBhcmVudE5vZGUsXG4gICAgICBrZXksXG4gICAgKTtcblxuICAgIGZvciAoY29uc3QgYXR0ciBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShhdHRyWzBdLCBhdHRyWzFdKTtcblxuICAgICAgc3dpdGNoIChhdHRyWzBdKSB7XG4gICAgICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgICAgIHRoaXMuI2NsYXNzTGlzdC52YWx1ZSA9IGF0dHJbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZFwiOlxuICAgICAgICAgIHRoaXMuI2N1cnJlbnRJZCA9IGF0dHJbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50YWdOYW1lID0gdGhpcy5ub2RlTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICB0aGlzLmxvY2FsTmFtZSA9IHRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIF9zaGFsbG93Q2xvbmUoKTogTm9kZSB7XG4gICAgLy8gRklYTUU6IFRoaXMgYXR0cmlidXRlIGNvcHlpbmcgbmVlZHMgdG8gYWxzbyBiZSBmaXhlZCBpbiBvdGhlclxuICAgIC8vIGVsZW1lbnRzIHRoYXQgb3ZlcnJpZGUgX3NoYWxsb3dDbG9uZSBsaWtlIDx0ZW1wbGF0ZT5cbiAgICBjb25zdCBhdHRyaWJ1dGVzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiB0aGlzLmdldEF0dHJpYnV0ZU5hbWVzKCkpIHtcbiAgICAgIGF0dHJpYnV0ZXMucHVzaChbYXR0cmlidXRlLCB0aGlzLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpIV0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEVsZW1lbnQodGhpcy5ub2RlTmFtZSwgbnVsbCwgYXR0cmlidXRlcywgQ1RPUl9LRVkpO1xuICB9XG5cbiAgZ2V0IGNoaWxkRWxlbWVudENvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCkubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IGNsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpID8/IFwiXCI7XG4gIH1cblxuICBzZXQgY2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgIHRoaXMuI2NsYXNzTGlzdC52YWx1ZSA9IGNsYXNzTmFtZTtcbiAgfVxuXG4gIGdldCBjbGFzc0xpc3QoKTogRE9NVG9rZW5MaXN0IHtcbiAgICByZXR1cm4gdGhpcy4jY2xhc3NMaXN0O1xuICB9XG5cbiAgZ2V0IG91dGVySFRNTCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBnZXRPdXRlck9ySW5uZXJIdG1sKHRoaXMsIHRydWUpO1xuICB9XG5cbiAgc2V0IG91dGVySFRNTChodG1sOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCB7IHBhcmVudEVsZW1lbnQsIHBhcmVudE5vZGUgfSA9IHRoaXM7XG4gICAgICBsZXQgY29udGV4dExvY2FsTmFtZSA9IHBhcmVudEVsZW1lbnQ/LmxvY2FsTmFtZTtcblxuICAgICAgc3dpdGNoIChwYXJlbnROb2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgTm9kZVR5cGUuRE9DVU1FTlRfTk9ERToge1xuICAgICAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgICAgICBcIk1vZGlmaWNhdGlvbnMgYXJlIG5vdCBhbGxvd2VkIGZvciB0aGlzIGRvY3VtZW50XCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldHRpbmcgb3V0ZXJIVE1MLCBzdGVwIDQuIERvY3VtZW50IEZyYWdtZW50XG4gICAgICAgIC8vIHJlZjogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0RPTS1QYXJzaW5nLyNkb20tZWxlbWVudC1vdXRlcmh0bWxcbiAgICAgICAgY2FzZSBOb2RlVHlwZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFOiB7XG4gICAgICAgICAgY29udGV4dExvY2FsTmFtZSA9IFwiYm9keVwiO1xuICAgICAgICAgIC8vIGZhbGwtdGhyb3VnaFxuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgIGNvbnN0IHsgY2hpbGROb2RlczogbmV3Q2hpbGROb2RlcyB9ID1cbiAgICAgICAgICAgIGZyYWdtZW50Tm9kZXNGcm9tU3RyaW5nKGh0bWwsIGNvbnRleHRMb2NhbE5hbWUhKS5jaGlsZE5vZGVzWzBdO1xuICAgICAgICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnROb2RlLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgICAgICAgIGNvbnN0IGluc2VydGlvbkluZGV4ID0gbXV0YXRvci5pbmRleE9mKHRoaXMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IG5ld0NoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gbmV3Q2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgIG11dGF0b3Iuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCBjaGlsZCk7XG4gICAgICAgICAgICBjaGlsZC5fc2V0UGFyZW50KHBhcmVudE5vZGUpO1xuICAgICAgICAgICAgY2hpbGQuX3NldE93bmVyRG9jdW1lbnQocGFyZW50Tm9kZS5vd25lckRvY3VtZW50KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGlubmVySFRNTCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBnZXRPdXRlck9ySW5uZXJIdG1sKHRoaXMsIGZhbHNlKTtcbiAgfVxuXG4gIHNldCBpbm5lckhUTUwoaHRtbDogc3RyaW5nKSB7XG4gICAgLy8gUmVtb3ZlIGFsbCBjaGlsZHJlblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBjaGlsZC5fc2V0UGFyZW50KG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG11dGF0b3IgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgIG11dGF0b3Iuc3BsaWNlKDAsIHRoaXMuY2hpbGROb2Rlcy5sZW5ndGgpO1xuXG4gICAgLy8gUGFyc2UgSFRNTCBpbnRvIG5ldyBjaGlsZHJlblxuICAgIGlmIChodG1sLmxlbmd0aCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gZnJhZ21lbnROb2Rlc0Zyb21TdHJpbmcoaHRtbCwgdGhpcy5sb2NhbE5hbWUpO1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBwYXJzZWQuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzKSB7XG4gICAgICAgIG11dGF0b3IucHVzaChjaGlsZCk7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICAgIGNoaWxkLl9zZXRQYXJlbnQodGhpcyk7XG4gICAgICAgIGNoaWxkLl9zZXRPd25lckRvY3VtZW50KHRoaXMub3duZXJEb2N1bWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGlubmVyVGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnRleHRDb250ZW50O1xuICB9XG5cbiAgc2V0IGlubmVyVGV4dCh0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLnRleHRDb250ZW50ID0gdGV4dDtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBIVE1MQ29sbGVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCk7XG4gIH1cblxuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jY3VycmVudElkIHx8IFwiXCI7XG4gIH1cblxuICBzZXQgaWQoaWQ6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiaWRcIiwgdGhpcy4jY3VycmVudElkID0gaWQpO1xuICB9XG5cbiAgZ2V0IGRhdGFzZXQoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMuI2RhdGFzZXRQcm94eSkge1xuICAgICAgcmV0dXJuIHRoaXMuI2RhdGFzZXRQcm94eTtcbiAgICB9XG5cbiAgICB0aGlzLiNkYXRhc2V0UHJveHkgPSBuZXcgUHJveHk8UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPj4oe30sIHtcbiAgICAgIGdldDogKF90YXJnZXQsIHByb3BlcnR5LCBfcmVjZWl2ZXIpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBnZXREYXRhc2V0SHRtbEF0dHJOYW1lKHByb3BlcnR5KTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0sXG5cbiAgICAgIHNldDogKF90YXJnZXQsIHByb3BlcnR5LCB2YWx1ZSwgX3JlY2VpdmVyKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvcGVydHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBsZXQgYXR0cmlidXRlTmFtZSA9IFwiZGF0YS1cIjtcblxuICAgICAgICAgIGxldCBwcmV2Q2hhciA9IFwiXCI7XG4gICAgICAgICAgZm9yIChjb25zdCBjaGFyIG9mIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAvLyBTdGVwIDEuIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2RvbS1kb21zdHJpbmdtYXAtc2V0aXRlbVxuICAgICAgICAgICAgaWYgKHByZXZDaGFyID09PSBcIi1cIiAmJiBsb3dlckNhc2VDaGFyUmUudGVzdChjaGFyKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgICAgICAgICAgIFwiQW4gaW52YWxpZCBvciBpbGxlZ2FsIHN0cmluZyB3YXMgc3BlY2lmaWVkXCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN0ZXAgNC4gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZG9tLmh0bWwjZG9tLWRvbXN0cmluZ21hcC1zZXRpdGVtXG4gICAgICAgICAgICBpZiAoIXhtbE5hbWVDaGFyUmUudGVzdChjaGFyKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdGVwIDIuIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2RvbS1kb21zdHJpbmdtYXAtc2V0aXRlbVxuICAgICAgICAgICAgaWYgKHVwcGVyQ2FzZUNoYXJSZS50ZXN0KGNoYXIpKSB7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWUgKz0gXCItXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWUgKz0gY2hhci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgcHJldkNoYXIgPSBjaGFyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIFN0cmluZyh2YWx1ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuXG4gICAgICBkZWxldGVQcm9wZXJ0eTogKF90YXJnZXQsIHByb3BlcnR5KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvcGVydHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gZ2V0RGF0YXNldEh0bWxBdHRyTmFtZShwcm9wZXJ0eSk7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgIG93bktleXM6IChfdGFyZ2V0KSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgLmdldEF0dHJpYnV0ZU5hbWVzKClcbiAgICAgICAgICAuZmxhdE1hcCgoYXR0cmlidXRlTmFtZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUuc3RhcnRzV2l0aD8uKFwiZGF0YS1cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFtnZXREYXRhc2V0SmF2YXNjcmlwdE5hbWUoYXR0cmlidXRlTmFtZSldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOiAoX3RhcmdldCwgcHJvcGVydHkpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBnZXREYXRhc2V0SHRtbEF0dHJOYW1lKHByb3BlcnR5KTtcbiAgICAgICAgICBpZiAodGhpcy5oYXNBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IChfdGFyZ2V0LCBwcm9wZXJ0eSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGdldERhdGFzZXRIdG1sQXR0ck5hbWUocHJvcGVydHkpO1xuICAgICAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy4jZGF0YXNldFByb3h5O1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlTmFtZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNbZ2V0TmFtZWROb2RlTWFwQXR0ck5hbWVzU3ltXSgpO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNbZ2V0TmFtZWROb2RlTWFwVmFsdWVTeW1dKG5hbWUudG9Mb3dlckNhc2UoKSkgPz8gbnVsbDtcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZShyYXdOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBjb25zdCBuYW1lID0gU3RyaW5nKHJhd05hbWU/LnRvTG93ZXJDYXNlKCkpO1xuICAgIGNvbnN0IHN0clZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXNbc2V0TmFtZWROb2RlTWFwVmFsdWVTeW1dKG5hbWUsIHN0clZhbHVlKTtcblxuICAgIGlmIChuYW1lID09PSBcImlkXCIpIHtcbiAgICAgIHRoaXMuI2N1cnJlbnRJZCA9IHN0clZhbHVlO1xuICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgICB0aGlzLiNjbGFzc0xpc3QudmFsdWUgPSBzdHJWYWx1ZTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVBdHRyaWJ1dGUocmF3TmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbmFtZSA9IFN0cmluZyhyYXdOYW1lPy50b0xvd2VyQ2FzZSgpKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXNbcmVtb3ZlTmFtZWROb2RlTWFwQXR0clN5bV0obmFtZSk7XG5cbiAgICBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgICB0aGlzLiNjbGFzc0xpc3QudmFsdWUgPSBcIlwiO1xuICAgIH1cbiAgfVxuXG4gIGhhc0F0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2dldE5hbWVkTm9kZU1hcFZhbHVlU3ltXShcbiAgICAgIFN0cmluZyhuYW1lPy50b0xvd2VyQ2FzZSgpKSxcbiAgICApICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICBoYXNBdHRyaWJ1dGVOUyhfbmFtZXNwYWNlOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIFRPRE86IFVzZSBuYW1lc3BhY2VcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2dldE5hbWVkTm9kZU1hcFZhbHVlU3ltXShcbiAgICAgIFN0cmluZyhuYW1lPy50b0xvd2VyQ2FzZSgpKSxcbiAgICApICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXBsYWNlV2l0aCguLi5ub2RlczogKE5vZGUgfCBzdHJpbmcpW10pIHtcbiAgICB0aGlzLl9yZXBsYWNlV2l0aCguLi5ub2Rlcyk7XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgdGhpcy5fcmVtb3ZlKCk7XG4gIH1cblxuICBhcHBlbmQoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgY29uc3QgbXV0YXRvciA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgbXV0YXRvci5wdXNoKC4uLm5vZGVzQW5kVGV4dE5vZGVzKG5vZGVzLCB0aGlzKSk7XG4gIH1cblxuICBwcmVwZW5kKC4uLm5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSkge1xuICAgIGNvbnN0IG11dGF0b3IgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgIG11dGF0b3Iuc3BsaWNlKDAsIDAsIC4uLm5vZGVzQW5kVGV4dE5vZGVzKG5vZGVzLCB0aGlzKSk7XG4gIH1cblxuICBiZWZvcmUoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgaW5zZXJ0QmVmb3JlQWZ0ZXIodGhpcywgbm9kZXMsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIGFmdGVyKC4uLm5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSkge1xuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIGluc2VydEJlZm9yZUFmdGVyKHRoaXMsIG5vZGVzLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZpcnN0RWxlbWVudENoaWxkKCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCk7XG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdID8/IG51bGw7XG4gIH1cblxuICBnZXQgbGFzdEVsZW1lbnRDaGlsZCgpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXSA/PyBudWxsO1xuICB9XG5cbiAgZ2V0IG5leHRFbGVtZW50U2libGluZygpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgY29uc3QgaW5kZXggPSBtdXRhdG9yLmluZGV4T2ZFbGVtZW50c1ZpZXcodGhpcyk7XG4gICAgY29uc3QgZWxlbWVudHMgPSBtdXRhdG9yLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tpbmRleCArIDFdID8/IG51bGw7XG4gIH1cblxuICBnZXQgcHJldmlvdXNFbGVtZW50U2libGluZygpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgY29uc3QgaW5kZXggPSBtdXRhdG9yLmluZGV4T2ZFbGVtZW50c1ZpZXcodGhpcyk7XG4gICAgY29uc3QgZWxlbWVudHMgPSBtdXRhdG9yLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tpbmRleCAtIDFdID8/IG51bGw7XG4gIH1cblxuICBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yczogc3RyaW5nKTogRWxlbWVudCB8IG51bGwge1xuICAgIGlmICghdGhpcy5vd25lckRvY3VtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtZW50IG11c3QgaGF2ZSBhbiBvd25lciBkb2N1bWVudFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuZmlyc3Qoc2VsZWN0b3JzLCB0aGlzKTtcbiAgfVxuXG4gIHF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzOiBzdHJpbmcpOiBOb2RlTGlzdCB7XG4gICAgaWYgKCF0aGlzLm93bmVyRG9jdW1lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVsZW1lbnQgbXVzdCBoYXZlIGFuIG93bmVyIGRvY3VtZW50XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVMaXN0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgY29uc3QgbXV0YXRvciA9IG5vZGVMaXN0W25vZGVMaXN0TXV0YXRvclN5bV0oKTtcblxuICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgdGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuc2VsZWN0KHNlbGVjdG9ycywgdGhpcykpIHtcbiAgICAgIG11dGF0b3IucHVzaChtYXRjaCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGVMaXN0O1xuICB9XG5cbiAgbWF0Y2hlcyhzZWxlY3RvclN0cmluZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMub3duZXJEb2N1bWVudCEuX253YXBpLm1hdGNoKHNlbGVjdG9yU3RyaW5nLCB0aGlzKTtcbiAgfVxuXG4gIGNsb3Nlc3Qoc2VsZWN0b3JTdHJpbmc6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7IG1hdGNoIH0gPSB0aGlzLm93bmVyRG9jdW1lbnQhLl9ud2FwaTsgLy8gU2VlIG5vdGUgYmVsb3dcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLXRoaXMtYWxpYXNcbiAgICBsZXQgZWw6IEVsZW1lbnQgfCBudWxsID0gdGhpcztcbiAgICBkbyB7XG4gICAgICAvLyBOb3RlOiBOb3QgdXNpbmcgYGVsLm1hdGNoZXMoc2VsZWN0b3JTdHJpbmcpYCBiZWNhdXNlIG9uIGEgYnJvd3NlciBpZiB5b3Ugb3ZlcnJpZGVcbiAgICAgIC8vIGBtYXRjaGVzYCwgeW91ICpkb24ndCogc2VlIGl0IGJlaW5nIHVzZWQgYnkgYGNsb3Nlc3RgLlxuICAgICAgaWYgKG1hdGNoKHNlbGVjdG9yU3RyaW5nLCBlbCkpIHtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfVxuICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgIH0gd2hpbGUgKGVsICE9PSBudWxsKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFRPRE86IERSWSEhIVxuICBnZXRFbGVtZW50QnlJZChpZDogc3RyaW5nKTogRWxlbWVudCB8IG51bGwge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBpZiAoKDxFbGVtZW50PiBjaGlsZCkuaWQgPT09IGlkKSB7XG4gICAgICAgICAgcmV0dXJuIDxFbGVtZW50PiBjaGlsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlYXJjaCA9ICg8RWxlbWVudD4gY2hpbGQpLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgaWYgKHNlYXJjaCkge1xuICAgICAgICAgIHJldHVybiBzZWFyY2g7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWU6IHN0cmluZyk6IEVsZW1lbnRbXSB7XG4gICAgY29uc3QgZml4Q2FzZVRhZ05hbWUgPSB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG5cbiAgICBpZiAoZml4Q2FzZVRhZ05hbWUgPT09IFwiKlwiKSB7XG4gICAgICByZXR1cm4gPEVsZW1lbnRbXT4gdGhpcy5fZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiA8RWxlbWVudFtdPiB0aGlzLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLnRvVXBwZXJDYXNlKCksIFtdKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChzZWFyY2g6IE5vZGVbXSk6IE5vZGVbXSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgKDxFbGVtZW50PiBjaGlsZCkuX2dldEVsZW1lbnRzQnlUYWdOYW1lV2lsZGNhcmQoc2VhcmNoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VhcmNoO1xuICB9XG5cbiAgX2dldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWU6IHN0cmluZywgc2VhcmNoOiBOb2RlW10pOiBOb2RlW10ge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBpZiAoKDxFbGVtZW50PiBjaGlsZCkudGFnTmFtZSA9PT0gdGFnTmFtZSkge1xuICAgICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgICg8RWxlbWVudD4gY2hpbGQpLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLCBzZWFyY2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2g7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKTogRWxlbWVudFtdIHtcbiAgICByZXR1cm4gPEVsZW1lbnRbXT4gZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSh0aGlzLCBjbGFzc05hbWUsIFtdKTtcbiAgfVxuXG4gIGdldEVsZW1lbnRzQnlUYWdOYW1lTlMoX25hbWVzcGFjZTogc3RyaW5nLCBsb2NhbE5hbWU6IHN0cmluZyk6IEVsZW1lbnRbXSB7XG4gICAgLy8gVE9ETzogVXNlIG5hbWVzcGFjZVxuICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGxvY2FsTmFtZSk7XG4gIH1cbn1cblxuVXRpbFR5cGVzLkVsZW1lbnQgPSBFbGVtZW50O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTLFFBQVEsUUFBUSx5QkFBeUI7QUFDbEQsU0FBUyx1QkFBdUIsUUFBUSxvQkFBb0I7QUFDNUQsU0FBUyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxRQUFRLFlBQVk7QUFDOUQsU0FBUyxRQUFRLEVBQUUsa0JBQWtCLFFBQVEsaUJBQWlCO0FBRTlELFNBQ0Usc0JBQXNCLEVBQ3RCLHdCQUF3QixFQUN4QixzQkFBc0IsRUFDdEIsbUJBQW1CLEVBQ25CLGlCQUFpQixFQUNqQixlQUFlLEVBQ2YsZUFBZSxRQUNWLGFBQWE7QUFDcEIsT0FBTyxlQUFlLG1CQUFtQjtlQWlGckMsT0FBTyxRQUFRO0FBM0VuQixPQUFPLE1BQU07RUFDWCxDQUFDLE1BQU0sR0FBRyxHQUFHO0VBQ2IsSUFBSSxDQUFDLEtBQUs7SUFDUixPQUFPLElBQUksQ0FBQyxDQUFDLE1BQU07RUFDckI7RUFDQSxJQUFJLENBQUMsS0FBSyxDQUNSLEtBQWE7SUFFYixJQUFJLENB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