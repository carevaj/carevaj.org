import { CTOR_KEY } from "../constructor-lock.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
import { insertBeforeAfter, isDocumentFragment, moveDocumentFragmentChildren } from "./utils.ts";
export var NodeType;
(function(NodeType) {
  NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
  NodeType[NodeType["ATTRIBUTE_NODE"] = 2] = "ATTRIBUTE_NODE";
  NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
  NodeType[NodeType["CDATA_SECTION_NODE"] = 4] = "CDATA_SECTION_NODE";
  NodeType[NodeType["ENTITY_REFERENCE_NODE"] = 5] = "ENTITY_REFERENCE_NODE";
  NodeType[NodeType["ENTITY_NODE"] = 6] = "ENTITY_NODE";
  NodeType[NodeType["PROCESSING_INSTRUCTION_NODE"] = 7] = "PROCESSING_INSTRUCTION_NODE";
  NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
  NodeType[NodeType["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
  NodeType[NodeType["DOCUMENT_TYPE_NODE"] = 10] = "DOCUMENT_TYPE_NODE";
  NodeType[NodeType["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
  NodeType[NodeType["NOTATION_NODE"] = 12] = "NOTATION_NODE";
})(NodeType || (NodeType = {}));
/**
 * Throws if any of the nodes are an ancestor
 * of `parentNode`
 */ export const nodesAndTextNodes = (nodes, parentNode)=>{
  return nodes.flatMap((n)=>{
    if (isDocumentFragment(n)) {
      const children = Array.from(n.childNodes);
      moveDocumentFragmentChildren(n, parentNode);
      return children;
    } else {
      const node = n instanceof Node ? n : new Text("" + n);
      // Make sure the node isn't an ancestor of parentNode
      if (n === node && parentNode) {
        parentNode._assertNotAncestor(node);
      }
      // Remove from parentNode (if any)
      node._remove(true);
      // Set new parent
      node._setParent(parentNode, true);
      return [
        node
      ];
    }
  });
};
export class Node extends EventTarget {
  nodeName;
  nodeType;
  #nodeValue;
  childNodes;
  parentNode;
  parentElement;
  #childNodesMutator;
  #ownerDocument;
  _ancestors;
  // Instance constants defined after Node
  // class body below to avoid clutter
  static ELEMENT_NODE = NodeType.ELEMENT_NODE;
  static ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
  static TEXT_NODE = NodeType.TEXT_NODE;
  static CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
  static ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE;
  static ENTITY_NODE = NodeType.ENTITY_NODE;
  static PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
  static COMMENT_NODE = NodeType.COMMENT_NODE;
  static DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
  static DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
  static DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
  static NOTATION_NODE = NodeType.NOTATION_NODE;
  constructor(nodeName, nodeType, parentNode, key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor.");
    }
    super();
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.#nodeValue = null;
    this.parentNode = null;
    this.#ownerDocument = null;
    this._ancestors = new Set();
    this.#nodeValue = null;
    this.childNodes = new NodeList();
    this.#childNodesMutator = this.childNodes[nodeListMutatorSym]();
    this.parentElement = parentNode;
    if (parentNode) {
      parentNode.appendChild(this);
    }
  }
  _getChildNodesMutator() {
    return this.#childNodesMutator;
  }
  /**
   * Update ancestor chain & owner document for this child
   * and all its children.
   */ _setParent(newParent, force = false) {
    const sameParent = this.parentNode === newParent;
    const shouldUpdateParentAndAncestors = !sameParent || force;
    if (shouldUpdateParentAndAncestors) {
      this.parentNode = newParent;
      if (newParent) {
        if (!sameParent) {
          // If this a document node or another non-element node
          // then parentElement should be set to null
          if (newParent.nodeType === NodeType.ELEMENT_NODE) {
            this.parentElement = newParent;
          } else {
            this.parentElement = null;
          }
          this._setOwnerDocument(newParent.#ownerDocument);
        }
        // Add parent chain to ancestors
        this._ancestors = new Set(newParent._ancestors);
        this._ancestors.add(newParent);
      } else {
        this.parentElement = null;
        this._ancestors.clear();
      }
      // Update ancestors for child nodes
      for (const child of this.childNodes){
        child._setParent(this, shouldUpdateParentAndAncestors);
      }
    }
  }
  _assertNotAncestor(child) {
    // Check this child isn't an ancestor
    if (child.contains(this)) {
      throw new DOMException("The new child is an ancestor of the parent");
    }
  }
  _setOwnerDocument(document) {
    if (this.#ownerDocument !== document) {
      this.#ownerDocument = document;
      for (const child of this.childNodes){
        child._setOwnerDocument(document);
      }
    }
  }
  contains(child) {
    return child._ancestors.has(this) || child === this;
  }
  get ownerDocument() {
    return this.#ownerDocument;
  }
  get nodeValue() {
    return this.#nodeValue;
  }
  set nodeValue(value) {
  // Setting is ignored
  }
  get textContent() {
    let out = "";
    for (const child of this.childNodes){
      switch(child.nodeType){
        case NodeType.TEXT_NODE:
          out += child.nodeValue;
          break;
        case NodeType.ELEMENT_NODE:
          out += child.textContent;
          break;
      }
    }
    return out;
  }
  set textContent(content) {
    for (const child of this.childNodes){
      child._setParent(null);
    }
    this._getChildNodesMutator().splice(0, this.childNodes.length);
    this.appendChild(new Text(content));
  }
  get firstChild() {
    return this.childNodes[0] || null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  hasChildNodes() {
    return Boolean(this.childNodes.length);
  }
  cloneNode(deep = false) {
    const copy = this._shallowClone();
    copy._setOwnerDocument(this.ownerDocument);
    if (deep) {
      for (const child of this.childNodes){
        copy.appendChild(child.cloneNode(true));
      }
    }
    return copy;
  }
  _shallowClone() {
    throw new Error("Illegal invocation");
  }
  _remove(skipSetParent = false) {
    const parent = this.parentNode;
    if (parent) {
      const nodeList = parent._getChildNodesMutator();
      const idx = nodeList.indexOf(this);
      nodeList.splice(idx, 1);
      if (!skipSetParent) {
        this._setParent(null);
      }
    }
  }
  appendChild(child) {
    if (isDocumentFragment(child)) {
      const mutator = this._getChildNodesMutator();
      mutator.push(...child.childNodes);
      moveDocumentFragmentChildren(child, this);
      return child;
    } else {
      return child._appendTo(this);
    }
  }
  _appendTo(parentNode) {
    parentNode._assertNotAncestor(this); // FIXME: Should this really be a method?
    const oldParentNode = this.parentNode;
    // Check if we already own this child
    if (oldParentNode === parentNode) {
      if (parentNode._getChildNodesMutator().indexOf(this) !== -1) {
        return this;
      }
    } else if (oldParentNode) {
      this._remove();
    }
    this._setParent(parentNode, true);
    parentNode._getChildNodesMutator().push(this);
    return this;
  }
  removeChild(child) {
    // Just copy Firefox's error messages
    if (child && typeof child === "object") {
      if (child.parentNode === this) {
        child._remove();
        return child;
      } else {
        throw new DOMException("Node.removeChild: The node to be removed is not a child of this node");
      }
    } else {
      throw new TypeError("Node.removeChild: Argument 1 is not an object.");
    }
  }
  replaceChild(newChild, oldChild) {
    if (oldChild.parentNode !== this) {
      throw new Error("Old child's parent is not the current node.");
    }
    oldChild._replaceWith(newChild);
    return oldChild;
  }
  insertBefore(newNode, refNode) {
    this._assertNotAncestor(newNode);
    const mutator = this._getChildNodesMutator();
    if (refNode === null) {
      this.appendChild(newNode);
      return newNode;
    }
    const index = mutator.indexOf(refNode);
    if (index === -1) {
      throw new Error("DOMException: Child to insert before is not a child of this node");
    }
    if (isDocumentFragment(newNode)) {
      mutator.splice(index, 0, ...newNode.childNodes);
      moveDocumentFragmentChildren(newNode, this);
    } else {
      const oldParentNode = newNode.parentNode;
      const oldMutator = oldParentNode?._getChildNodesMutator();
      if (oldMutator) {
        oldMutator.splice(oldMutator.indexOf(newNode), 1);
      }
      newNode._setParent(this, oldParentNode !== this);
      mutator.splice(index, 0, newNode);
    }
    return newNode;
  }
  _replaceWith(...nodes) {
    if (this.parentNode) {
      const parentNode = this.parentNode;
      const mutator = parentNode._getChildNodesMutator();
      let viableNextSibling = null;
      {
        const thisIndex = mutator.indexOf(this);
        for(let i = thisIndex + 1; i < parentNode.childNodes.length; i++){
          if (!nodes.includes(parentNode.childNodes[i])) {
            viableNextSibling = parentNode.childNodes[i];
            break;
          }
        }
      }
      nodes = nodesAndTextNodes(nodes, parentNode);
      let index = viableNextSibling ? mutator.indexOf(viableNextSibling) : parentNode.childNodes.length;
      let deleteNumber;
      if (parentNode.childNodes[index - 1] === this) {
        index--;
        deleteNumber = 1;
      } else {
        deleteNumber = 0;
      }
      mutator.splice(index, deleteNumber, ...nodes);
      this._setParent(null);
    }
  }
  get nextSibling() {
    const parent = this.parentNode;
    if (!parent) {
      return null;
    }
    const index = parent._getChildNodesMutator().indexOf(this);
    const next = parent.childNodes[index + 1] || null;
    return next;
  }
  get previousSibling() {
    const parent = this.parentNode;
    if (!parent) {
      return null;
    }
    const index = parent._getChildNodesMutator().indexOf(this);
    const prev = parent.childNodes[index - 1] || null;
    return prev;
  }
  // Node.compareDocumentPosition()'s bitmask values
  static DOCUMENT_POSITION_DISCONNECTED = 1;
  static DOCUMENT_POSITION_PRECEDING = 2;
  static DOCUMENT_POSITION_FOLLOWING = 4;
  static DOCUMENT_POSITION_CONTAINS = 8;
  static DOCUMENT_POSITION_CONTAINED_BY = 16;
  static DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
  /**
   * FIXME: Does not implement attribute node checks
   * ref: https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
   */ compareDocumentPosition(other) {
    if (other === this) {
      return 0;
    }
    // Note: major browser implementations differ in their rejection error of
    // non-Node or nullish values so we just copy the most relevant error message
    // from Firefox
    if (!(other instanceof Node)) {
      throw new TypeError("Node.compareDocumentPosition: Argument 1 does not implement interface Node.");
    }
    let node1Root = other;
    let node2Root = this;
    const node1Hierarchy = [
      node1Root
    ];
    const node2Hierarchy = [
      node2Root
    ];
    while(node1Root.parentNode ?? node2Root.parentNode){
      node1Root = node1Root.parentNode ? (node1Hierarchy.push(node1Root.parentNode), node1Root.parentNode) : node1Root;
      node2Root = node2Root.parentNode ? (node2Hierarchy.push(node2Root.parentNode), node2Root.parentNode) : node2Root;
    }
    // Check if they don't share the same root node
    if (node1Root !== node2Root) {
      return Node.DOCUMENT_POSITION_DISCONNECTED | Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC | Node.DOCUMENT_POSITION_PRECEDING;
    }
    const longerHierarchy = node1Hierarchy.length > node2Hierarchy.length ? node1Hierarchy : node2Hierarchy;
    const shorterHierarchy = longerHierarchy === node1Hierarchy ? node2Hierarchy : node1Hierarchy;
    // Check if either is a container of the other
    if (longerHierarchy[longerHierarchy.length - shorterHierarchy.length] === shorterHierarchy[0]) {
      return longerHierarchy === node1Hierarchy ? Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING;
    }
    // Find their first common ancestor and see whether they
    // are preceding or following
    const longerStart = longerHierarchy.length - shorterHierarchy.length;
    for(let i = shorterHierarchy.length - 1; i >= 0; i--){
      const shorterHierarchyNode = shorterHierarchy[i];
      const longerHierarchyNode = longerHierarchy[longerStart + i];
      // We found the first common ancestor
      if (longerHierarchyNode !== shorterHierarchyNode) {
        const siblings = shorterHierarchyNode.parentNode._getChildNodesMutator();
        if (siblings.indexOf(shorterHierarchyNode) < siblings.indexOf(longerHierarchyNode)) {
          // Shorter is before longer
          if (shorterHierarchy === node1Hierarchy) {
            // Other is before this
            return Node.DOCUMENT_POSITION_PRECEDING;
          } else {
            // This is before other
            return Node.DOCUMENT_POSITION_FOLLOWING;
          }
        } else {
          // Longer is before shorter
          if (longerHierarchy === node1Hierarchy) {
            // Other is before this
            return Node.DOCUMENT_POSITION_PRECEDING;
          } else {
            // Other is after this
            return Node.DOCUMENT_POSITION_FOLLOWING;
          }
        }
      }
    }
    // FIXME: Should probably throw here because this
    // point should be unreachable code as per the
    // intended logic
    return Node.DOCUMENT_POSITION_FOLLOWING;
  }
  getRootNode(opts = {}) {
    if (this.parentNode) {
      return this.parentNode.getRootNode(opts);
    }
    if (opts.composed && this.host) {
      return this.host.getRootNode(opts);
    }
    return this;
  }
}
Node.prototype.ELEMENT_NODE = NodeType.ELEMENT_NODE;
Node.prototype.ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
Node.prototype.TEXT_NODE = NodeType.TEXT_NODE;
Node.prototype.CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
Node.prototype.ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE;
Node.prototype.ENTITY_NODE = NodeType.ENTITY_NODE;
Node.prototype.PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
Node.prototype.COMMENT_NODE = NodeType.COMMENT_NODE;
Node.prototype.DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
Node.prototype.DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
Node.prototype.DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
Node.prototype.NOTATION_NODE = NodeType.NOTATION_NODE;
export class CharacterData extends Node {
  #nodeValue = "";
  constructor(data, nodeName, nodeType, parentNode, key){
    super(nodeName, nodeType, parentNode, key);
    this.#nodeValue = data;
  }
  get nodeValue() {
    return this.#nodeValue;
  }
  set nodeValue(value) {
    this.#nodeValue = String(value ?? "");
  }
  get data() {
    return this.#nodeValue;
  }
  set data(value) {
    this.nodeValue = value;
  }
  get textContent() {
    return this.#nodeValue;
  }
  set textContent(value) {
    this.nodeValue = value;
  }
  get length() {
    return this.data.length;
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
  remove() {
    this._remove();
  }
  replaceWith(...nodes) {
    this._replaceWith(...nodes);
  }
}
export class Text extends CharacterData {
  constructor(text = ""){
    super(String(text), "#text", NodeType.TEXT_NODE, null, CTOR_KEY);
  }
  _shallowClone() {
    return new Text(this.textContent);
  }
  get textContent() {
    return this.nodeValue;
  }
}
export class Comment extends CharacterData {
  constructor(text = ""){
    super(String(text), "#comment", NodeType.COMMENT_NODE, null, CTOR_KEY);
  }
  _shallowClone() {
    return new Comment(this.textContent);
  }
  get textContent() {
    return this.nodeValue;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40NS9zcmMvZG9tL25vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuaW1wb3J0IHsgTm9kZUxpc3QsIE5vZGVMaXN0TXV0YXRvciwgbm9kZUxpc3RNdXRhdG9yU3ltIH0gZnJvbSBcIi4vbm9kZS1saXN0LnRzXCI7XG5pbXBvcnQge1xuICBpbnNlcnRCZWZvcmVBZnRlcixcbiAgaXNEb2N1bWVudEZyYWdtZW50LFxuICBtb3ZlRG9jdW1lbnRGcmFnbWVudENoaWxkcmVuLFxufSBmcm9tIFwiLi91dGlscy50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbGVtZW50IH0gZnJvbSBcIi4vZWxlbWVudC50c1wiO1xuaW1wb3J0IHR5cGUgeyBEb2N1bWVudCB9IGZyb20gXCIuL2RvY3VtZW50LnRzXCI7XG5pbXBvcnQgdHlwZSB7IERvY3VtZW50RnJhZ21lbnQgfSBmcm9tIFwiLi9kb2N1bWVudC1mcmFnbWVudC50c1wiO1xuXG5leHBvcnQgZW51bSBOb2RlVHlwZSB7XG4gIEVMRU1FTlRfTk9ERSA9IDEsXG4gIEFUVFJJQlVURV9OT0RFID0gMixcbiAgVEVYVF9OT0RFID0gMyxcbiAgQ0RBVEFfU0VDVElPTl9OT0RFID0gNCxcbiAgRU5USVRZX1JFRkVSRU5DRV9OT0RFID0gNSxcbiAgRU5USVRZX05PREUgPSA2LFxuICBQUk9DRVNTSU5HX0lOU1RSVUNUSU9OX05PREUgPSA3LFxuICBDT01NRU5UX05PREUgPSA4LFxuICBET0NVTUVOVF9OT0RFID0gOSxcbiAgRE9DVU1FTlRfVFlQRV9OT0RFID0gMTAsXG4gIERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSAxMSxcbiAgTk9UQVRJT05fTk9ERSA9IDEyLFxufVxuXG4vKipcbiAqIFRocm93cyBpZiBhbnkgb2YgdGhlIG5vZGVzIGFyZSBhbiBhbmNlc3RvclxuICogb2YgYHBhcmVudE5vZGVgXG4gKi9cbmV4cG9ydCBjb25zdCBub2Rlc0FuZFRleHROb2RlcyA9IChcbiAgbm9kZXM6IChOb2RlIHwgdW5rbm93bilbXSxcbiAgcGFyZW50Tm9kZTogTm9kZSxcbikgPT4ge1xuICByZXR1cm4gbm9kZXMuZmxhdE1hcCgobikgPT4ge1xuICAgIGlmIChpc0RvY3VtZW50RnJhZ21lbnQobiBhcyBOb2RlKSkge1xuICAgICAgY29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKChuIGFzIE5vZGUpLmNoaWxkTm9kZXMpO1xuICAgICAgbW92ZURvY3VtZW50RnJhZ21lbnRDaGlsZHJlbihuIGFzIERvY3VtZW50RnJhZ21lbnQsIHBhcmVudE5vZGUpO1xuICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBub2RlOiBOb2RlID0gbiBpbnN0YW5jZW9mIE5vZGUgPyBuIDogbmV3IFRleHQoXCJcIiArIG4pO1xuXG4gICAgICAvLyBNYWtlIHN1cmUgdGhlIG5vZGUgaXNuJ3QgYW4gYW5jZXN0b3Igb2YgcGFyZW50Tm9kZVxuICAgICAgaWYgKG4gPT09IG5vZGUgJiYgcGFyZW50Tm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLl9hc3NlcnROb3RBbmNlc3Rvcihub2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIGZyb20gcGFyZW50Tm9kZSAoaWYgYW55KVxuICAgICAgbm9kZS5fcmVtb3ZlKHRydWUpO1xuXG4gICAgICAvLyBTZXQgbmV3IHBhcmVudFxuICAgICAgbm9kZS5fc2V0UGFyZW50KHBhcmVudE5vZGUsIHRydWUpO1xuICAgICAgcmV0dXJuIFtub2RlXTtcbiAgICB9XG4gIH0pO1xufTtcblxuZXhwb3J0IGNsYXNzIE5vZGUgZXh0ZW5kcyBFdmVudFRhcmdldCB7XG4gICNub2RlVmFsdWU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgY2hpbGROb2RlczogTm9kZUxpc3Q7XG4gIHB1YmxpYyBwYXJlbnROb2RlOiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBwYXJlbnRFbGVtZW50OiBFbGVtZW50IHwgbnVsbDtcbiAgI2NoaWxkTm9kZXNNdXRhdG9yOiBOb2RlTGlzdE11dGF0b3I7XG4gICNvd25lckRvY3VtZW50OiBEb2N1bWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hbmNlc3RvcnMgPSBuZXcgU2V0PE5vZGU+KCk7XG5cbiAgLy8gSW5zdGFuY2UgY29uc3RhbnRzIGRlZmluZWQgYWZ0ZXIgTm9kZVxuICAvLyBjbGFzcyBib2R5IGJlbG93IHRvIGF2b2lkIGNsdXR0ZXJcbiAgc3RhdGljIEVMRU1FTlRfTk9ERSA9IE5vZGVUeXBlLkVMRU1FTlRfTk9ERTtcbiAgc3RhdGljIEFUVFJJQlVURV9OT0RFID0gTm9kZVR5cGUuQVRUUklCVVRFX05PREU7XG4gIHN0YXRpYyBURVhUX05PREUgPSBOb2RlVHlwZS5URVhUX05PREU7XG4gIHN0YXRpYyBDREFUQV9TRUNUSU9OX05PREUgPSBOb2RlVHlwZS5DREFUQV9TRUNUSU9OX05PREU7XG4gIHN0YXRpYyBFTlRJVFlfUkVGRVJFTkNFX05PREUgPSBOb2RlVHlwZS5FTlRJVFlfUkVGRVJFTkNFX05PREU7XG4gIHN0YXRpYyBFTlRJVFlfTk9ERSA9IE5vZGVUeXBlLkVOVElUWV9OT0RFO1xuICBzdGF0aWMgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFID0gTm9kZVR5cGUuUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFO1xuICBzdGF0aWMgQ09NTUVOVF9OT0RFID0gTm9kZVR5cGUuQ09NTUVOVF9OT0RFO1xuICBzdGF0aWMgRE9DVU1FTlRfTk9ERSA9IE5vZGVUeXBlLkRPQ1VNRU5UX05PREU7XG4gIHN0YXRpYyBET0NVTUVOVF9UWVBFX05PREUgPSBOb2RlVHlwZS5ET0NVTUVOVF9UWVBFX05PREU7XG4gIHN0YXRpYyBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gTm9kZVR5cGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERTtcbiAgc3RhdGljIE5PVEFUSU9OX05PREUgPSBOb2RlVHlwZS5OT1RBVElPTl9OT0RFO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBub2RlTmFtZTogc3RyaW5nLFxuICAgIHB1YmxpYyBub2RlVHlwZTogTm9kZVR5cGUsXG4gICAgcGFyZW50Tm9kZTogTm9kZSB8IG51bGwsXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIGlmIChrZXkgIT09IENUT1JfS0VZKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBjb25zdHJ1Y3Rvci5cIik7XG4gICAgfVxuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLiNub2RlVmFsdWUgPSBudWxsO1xuICAgIHRoaXMuY2hpbGROb2RlcyA9IG5ldyBOb2RlTGlzdCgpO1xuICAgIHRoaXMuI2NoaWxkTm9kZXNNdXRhdG9yID0gdGhpcy5jaGlsZE5vZGVzW25vZGVMaXN0TXV0YXRvclN5bV0oKTtcbiAgICB0aGlzLnBhcmVudEVsZW1lbnQgPSA8RWxlbWVudD4gcGFyZW50Tm9kZTtcblxuICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRDaGlsZE5vZGVzTXV0YXRvcigpOiBOb2RlTGlzdE11dGF0b3Ige1xuICAgIHJldHVybiB0aGlzLiNjaGlsZE5vZGVzTXV0YXRvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYW5jZXN0b3IgY2hhaW4gJiBvd25lciBkb2N1bWVudCBmb3IgdGhpcyBjaGlsZFxuICAgKiBhbmQgYWxsIGl0cyBjaGlsZHJlbi5cbiAgICovXG4gIF9zZXRQYXJlbnQobmV3UGFyZW50OiBOb2RlIHwgbnVsbCwgZm9yY2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IHNhbWVQYXJlbnQgPSB0aGlzLnBhcmVudE5vZGUgPT09IG5ld1BhcmVudDtcbiAgICBjb25zdCBzaG91bGRVcGRhdGVQYXJlbnRBbmRBbmNlc3RvcnMgPSAhc2FtZVBhcmVudCB8fCBmb3JjZTtcblxuICAgIGlmIChzaG91bGRVcGRhdGVQYXJlbnRBbmRBbmNlc3RvcnMpIHtcbiAgICAgIHRoaXMucGFyZW50Tm9kZSA9IG5ld1BhcmVudDtcblxuICAgICAgaWYgKG5ld1BhcmVudCkge1xuICAgICAgICBpZiAoIXNhbWVQYXJlbnQpIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGEgZG9jdW1lbnQgbm9kZSBvciBhbm90aGVyIG5vbi1lbGVtZW50IG5vZGVcbiAgICAgICAgICAvLyB0aGVuIHBhcmVudEVsZW1lbnQgc2hvdWxkIGJlIHNldCB0byBudWxsXG4gICAgICAgICAgaWYgKG5ld1BhcmVudC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQgPSBuZXdQYXJlbnQgYXMgdW5rbm93biBhcyBFbGVtZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX3NldE93bmVyRG9jdW1lbnQobmV3UGFyZW50LiNvd25lckRvY3VtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBwYXJlbnQgY2hhaW4gdG8gYW5jZXN0b3JzXG4gICAgICAgIHRoaXMuX2FuY2VzdG9ycyA9IG5ldyBTZXQobmV3UGFyZW50Ll9hbmNlc3RvcnMpO1xuICAgICAgICB0aGlzLl9hbmNlc3RvcnMuYWRkKG5ld1BhcmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9hbmNlc3RvcnMuY2xlYXIoKTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIGFuY2VzdG9ycyBmb3IgY2hpbGQgbm9kZXNcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICAgIGNoaWxkLl9zZXRQYXJlbnQodGhpcywgc2hvdWxkVXBkYXRlUGFyZW50QW5kQW5jZXN0b3JzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfYXNzZXJ0Tm90QW5jZXN0b3IoY2hpbGQ6IE5vZGUpIHtcbiAgICAvLyBDaGVjayB0aGlzIGNoaWxkIGlzbid0IGFuIGFuY2VzdG9yXG4gICAgaWYgKGNoaWxkLmNvbnRhaW5zKHRoaXMpKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiVGhlIG5ldyBjaGlsZCBpcyBhbiBhbmNlc3RvciBvZiB0aGUgcGFyZW50XCIpO1xuICAgIH1cbiAgfVxuXG4gIF9zZXRPd25lckRvY3VtZW50KGRvY3VtZW50OiBEb2N1bWVudCB8IG51bGwpIHtcbiAgICBpZiAodGhpcy4jb3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgIHRoaXMuI293bmVyRG9jdW1lbnQgPSBkb2N1bWVudDtcblxuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgICAgY2hpbGQuX3NldE93bmVyRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnRhaW5zKGNoaWxkOiBOb2RlKSB7XG4gICAgcmV0dXJuIGNoaWxkLl9hbmNlc3RvcnMuaGFzKHRoaXMpIHx8IGNoaWxkID09PSB0aGlzO1xuICB9XG5cbiAgZ2V0IG93bmVyRG9jdW1lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI293bmVyRG9jdW1lbnQ7XG4gIH1cblxuICBnZXQgbm9kZVZhbHVlKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiNub2RlVmFsdWU7XG4gIH1cblxuICBzZXQgbm9kZVZhbHVlKHZhbHVlOiB1bmtub3duKSB7XG4gICAgLy8gU2V0dGluZyBpcyBpZ25vcmVkXG4gIH1cblxuICBnZXQgdGV4dENvbnRlbnQoKTogc3RyaW5nIHtcbiAgICBsZXQgb3V0ID0gXCJcIjtcblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBzd2l0Y2ggKGNoaWxkLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgTm9kZVR5cGUuVEVYVF9OT0RFOlxuICAgICAgICAgIG91dCArPSBjaGlsZC5ub2RlVmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZVR5cGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIG91dCArPSBjaGlsZC50ZXh0Q29udGVudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgc2V0IHRleHRDb250ZW50KGNvbnRlbnQ6IHN0cmluZykge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBjaGlsZC5fc2V0UGFyZW50KG51bGwpO1xuICAgIH1cblxuICAgIHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuc3BsaWNlKDAsIHRoaXMuY2hpbGROb2Rlcy5sZW5ndGgpO1xuICAgIHRoaXMuYXBwZW5kQ2hpbGQobmV3IFRleHQoY29udGVudCkpO1xuICB9XG5cbiAgZ2V0IGZpcnN0Q2hpbGQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGROb2Rlc1swXSB8fCBudWxsO1xuICB9XG5cbiAgZ2V0IGxhc3RDaGlsZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZE5vZGVzW3RoaXMuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSB8fCBudWxsO1xuICB9XG5cbiAgaGFzQ2hpbGROb2RlcygpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmNoaWxkTm9kZXMubGVuZ3RoKTtcbiAgfVxuXG4gIGNsb25lTm9kZShkZWVwID0gZmFsc2UpOiBOb2RlIHtcbiAgICBjb25zdCBjb3B5ID0gdGhpcy5fc2hhbGxvd0Nsb25lKCk7XG5cbiAgICBjb3B5Ll9zZXRPd25lckRvY3VtZW50KHRoaXMub3duZXJEb2N1bWVudCk7XG5cbiAgICBpZiAoZGVlcCkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgICAgY29weS5hcHBlbmRDaGlsZChjaGlsZC5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb3B5IGFzIHRoaXM7XG4gIH1cblxuICBfc2hhbGxvd0Nsb25lKCk6IE5vZGUge1xuICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgaW52b2NhdGlvblwiKTtcbiAgfVxuXG4gIF9yZW1vdmUoc2tpcFNldFBhcmVudCA9IGZhbHNlKSB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgY29uc3Qgbm9kZUxpc3QgPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgICBjb25zdCBpZHggPSBub2RlTGlzdC5pbmRleE9mKHRoaXMpO1xuICAgICAgbm9kZUxpc3Quc3BsaWNlKGlkeCwgMSk7XG5cbiAgICAgIGlmICghc2tpcFNldFBhcmVudCkge1xuICAgICAgICB0aGlzLl9zZXRQYXJlbnQobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXBwZW5kQ2hpbGQoY2hpbGQ6IE5vZGUpOiBOb2RlIHtcbiAgICBpZiAoaXNEb2N1bWVudEZyYWdtZW50KGNoaWxkKSkge1xuICAgICAgY29uc3QgbXV0YXRvciA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgICBtdXRhdG9yLnB1c2goLi4uY2hpbGQuY2hpbGROb2Rlcyk7XG4gICAgICBtb3ZlRG9jdW1lbnRGcmFnbWVudENoaWxkcmVuKGNoaWxkLCB0aGlzKTtcblxuICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY2hpbGQuX2FwcGVuZFRvKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9hcHBlbmRUbyhwYXJlbnROb2RlOiBOb2RlKSB7XG4gICAgcGFyZW50Tm9kZS5fYXNzZXJ0Tm90QW5jZXN0b3IodGhpcyk7IC8vIEZJWE1FOiBTaG91bGQgdGhpcyByZWFsbHkgYmUgYSBtZXRob2Q/XG4gICAgY29uc3Qgb2xkUGFyZW50Tm9kZSA9IHRoaXMucGFyZW50Tm9kZTtcblxuICAgIC8vIENoZWNrIGlmIHdlIGFscmVhZHkgb3duIHRoaXMgY2hpbGRcbiAgICBpZiAob2xkUGFyZW50Tm9kZSA9PT0gcGFyZW50Tm9kZSkge1xuICAgICAgaWYgKHBhcmVudE5vZGUuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuaW5kZXhPZih0aGlzKSAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvbGRQYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLl9yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRQYXJlbnQocGFyZW50Tm9kZSwgdHJ1ZSk7XG4gICAgcGFyZW50Tm9kZS5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKS5wdXNoKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZDogTm9kZSkge1xuICAgIC8vIEp1c3QgY29weSBGaXJlZm94J3MgZXJyb3IgbWVzc2FnZXNcbiAgICBpZiAoY2hpbGQgJiYgdHlwZW9mIGNoaWxkID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSA9PT0gdGhpcykge1xuICAgICAgICBjaGlsZC5fcmVtb3ZlKCk7XG4gICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgICAgXCJOb2RlLnJlbW92ZUNoaWxkOiBUaGUgbm9kZSB0byBiZSByZW1vdmVkIGlzIG5vdCBhIGNoaWxkIG9mIHRoaXMgbm9kZVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTm9kZS5yZW1vdmVDaGlsZDogQXJndW1lbnQgMSBpcyBub3QgYW4gb2JqZWN0LlwiKTtcbiAgICB9XG4gIH1cblxuICByZXBsYWNlQ2hpbGQobmV3Q2hpbGQ6IE5vZGUsIG9sZENoaWxkOiBOb2RlKTogTm9kZSB7XG4gICAgaWYgKG9sZENoaWxkLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9sZCBjaGlsZCdzIHBhcmVudCBpcyBub3QgdGhlIGN1cnJlbnQgbm9kZS5cIik7XG4gICAgfVxuXG4gICAgb2xkQ2hpbGQuX3JlcGxhY2VXaXRoKG5ld0NoaWxkKTtcbiAgICByZXR1cm4gb2xkQ2hpbGQ7XG4gIH1cblxuICBpbnNlcnRCZWZvcmUobmV3Tm9kZTogTm9kZSwgcmVmTm9kZTogTm9kZSB8IG51bGwpOiBOb2RlIHtcbiAgICB0aGlzLl9hc3NlcnROb3RBbmNlc3RvcihuZXdOb2RlKTtcbiAgICBjb25zdCBtdXRhdG9yID0gdGhpcy5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcblxuICAgIGlmIChyZWZOb2RlID09PSBudWxsKSB7XG4gICAgICB0aGlzLmFwcGVuZENoaWxkKG5ld05vZGUpO1xuICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXggPSBtdXRhdG9yLmluZGV4T2YocmVmTm9kZSk7XG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkRPTUV4Y2VwdGlvbjogQ2hpbGQgdG8gaW5zZXJ0IGJlZm9yZSBpcyBub3QgYSBjaGlsZCBvZiB0aGlzIG5vZGVcIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGlzRG9jdW1lbnRGcmFnbWVudChuZXdOb2RlKSkge1xuICAgICAgbXV0YXRvci5zcGxpY2UoaW5kZXgsIDAsIC4uLm5ld05vZGUuY2hpbGROb2Rlcyk7XG4gICAgICBtb3ZlRG9jdW1lbnRGcmFnbWVudENoaWxkcmVuKG5ld05vZGUsIHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBvbGRQYXJlbnROb2RlID0gbmV3Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgY29uc3Qgb2xkTXV0YXRvciA9IG9sZFBhcmVudE5vZGU/Ll9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuXG4gICAgICBpZiAob2xkTXV0YXRvcikge1xuICAgICAgICBvbGRNdXRhdG9yLnNwbGljZShvbGRNdXRhdG9yLmluZGV4T2YobmV3Tm9kZSksIDEpO1xuICAgICAgfVxuXG4gICAgICBuZXdOb2RlLl9zZXRQYXJlbnQodGhpcywgb2xkUGFyZW50Tm9kZSAhPT0gdGhpcyk7XG4gICAgICBtdXRhdG9yLnNwbGljZShpbmRleCwgMCwgbmV3Tm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld05vZGU7XG4gIH1cblxuICBfcmVwbGFjZVdpdGgoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnROb2RlLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgICAgbGV0IHZpYWJsZU5leHRTaWJsaW5nOiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgICB7XG4gICAgICAgIGNvbnN0IHRoaXNJbmRleCA9IG11dGF0b3IuaW5kZXhPZih0aGlzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXNJbmRleCArIDE7IGkgPCBwYXJlbnROb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIW5vZGVzLmluY2x1ZGVzKHBhcmVudE5vZGUuY2hpbGROb2Rlc1tpXSkpIHtcbiAgICAgICAgICAgIHZpYWJsZU5leHRTaWJsaW5nID0gcGFyZW50Tm9kZS5jaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub2RlcyA9IG5vZGVzQW5kVGV4dE5vZGVzKG5vZGVzLCBwYXJlbnROb2RlKTtcblxuICAgICAgbGV0IGluZGV4ID0gdmlhYmxlTmV4dFNpYmxpbmdcbiAgICAgICAgPyBtdXRhdG9yLmluZGV4T2YodmlhYmxlTmV4dFNpYmxpbmcpXG4gICAgICAgIDogcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgIGxldCBkZWxldGVOdW1iZXI7XG4gICAgICBpZiAocGFyZW50Tm9kZS5jaGlsZE5vZGVzW2luZGV4IC0gMV0gPT09IHRoaXMpIHtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgICAgZGVsZXRlTnVtYmVyID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZU51bWJlciA9IDA7XG4gICAgICB9XG4gICAgICBtdXRhdG9yLnNwbGljZShpbmRleCwgZGVsZXRlTnVtYmVyLCAuLi4obm9kZXMgYXMgTm9kZVtdKSk7XG4gICAgICB0aGlzLl9zZXRQYXJlbnQobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IG5leHRTaWJsaW5nKCk6IE5vZGUgfCBudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG5cbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuaW5kZXhPZih0aGlzKTtcbiAgICBjb25zdCBuZXh0OiBOb2RlIHwgbnVsbCA9IHBhcmVudC5jaGlsZE5vZGVzW2luZGV4ICsgMV0gfHwgbnVsbDtcblxuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgZ2V0IHByZXZpb3VzU2libGluZygpOiBOb2RlIHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gcGFyZW50Ll9nZXRDaGlsZE5vZGVzTXV0YXRvcigpLmluZGV4T2YodGhpcyk7XG4gICAgY29uc3QgcHJldjogTm9kZSB8IG51bGwgPSBwYXJlbnQuY2hpbGROb2Rlc1tpbmRleCAtIDFdIHx8IG51bGw7XG5cbiAgICByZXR1cm4gcHJldjtcbiAgfVxuXG4gIC8vIE5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24oKSdzIGJpdG1hc2sgdmFsdWVzXG4gIHB1YmxpYyBzdGF0aWMgRE9DVU1FTlRfUE9TSVRJT05fRElTQ09OTkVDVEVEID0gMSBhcyBjb25zdDtcbiAgcHVibGljIHN0YXRpYyBET0NVTUVOVF9QT1NJVElPTl9QUkVDRURJTkcgPSAyIGFzIGNvbnN0O1xuICBwdWJsaWMgc3RhdGljIERPQ1VNRU5UX1BPU0lUSU9OX0ZPTExPV0lORyA9IDQgYXMgY29uc3Q7XG4gIHB1YmxpYyBzdGF0aWMgRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTlMgPSA4IGFzIGNvbnN0O1xuICBwdWJsaWMgc3RhdGljIERPQ1VNRU5UX1BPU0lUSU9OX0NPTlRBSU5FRF9CWSA9IDE2IGFzIGNvbnN0O1xuICBwdWJsaWMgc3RhdGljIERPQ1VNRU5UX1BPU0lUSU9OX0lNUExFTUVOVEFUSU9OX1NQRUNJRklDID0gMzIgYXMgY29uc3Q7XG5cbiAgLyoqXG4gICAqIEZJWE1FOiBEb2VzIG5vdCBpbXBsZW1lbnQgYXR0cmlidXRlIG5vZGUgY2hlY2tzXG4gICAqIHJlZjogaHR0cHM6Ly9kb20uc3BlYy53aGF0d2cub3JnLyNkb20tbm9kZS1jb21wYXJlZG9jdW1lbnRwb3NpdGlvblxuICAgKiBNRE46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL2NvbXBhcmVEb2N1bWVudFBvc2l0aW9uXG4gICAqL1xuICBjb21wYXJlRG9jdW1lbnRQb3NpdGlvbihvdGhlcjogTm9kZSkge1xuICAgIGlmIChvdGhlciA9PT0gdGhpcykge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgLy8gTm90ZTogbWFqb3IgYnJvd3NlciBpbXBsZW1lbnRhdGlvbnMgZGlmZmVyIGluIHRoZWlyIHJlamVjdGlvbiBlcnJvciBvZlxuICAgIC8vIG5vbi1Ob2RlIG9yIG51bGxpc2ggdmFsdWVzIHNvIHdlIGp1c3QgY29weSB0aGUgbW9zdCByZWxldmFudCBlcnJvciBtZXNzYWdlXG4gICAgLy8gZnJvbSBGaXJlZm94XG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBOb2RlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJOb2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uOiBBcmd1bWVudCAxIGRvZXMgbm90IGltcGxlbWVudCBpbnRlcmZhY2UgTm9kZS5cIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IG5vZGUxUm9vdCA9IG90aGVyO1xuICAgIGxldCBub2RlMlJvb3QgPSB0aGlzIGFzIE5vZGU7XG4gICAgY29uc3Qgbm9kZTFIaWVyYXJjaHkgPSBbbm9kZTFSb290XTtcbiAgICBjb25zdCBub2RlMkhpZXJhcmNoeSA9IFtub2RlMlJvb3RdO1xuICAgIHdoaWxlIChub2RlMVJvb3QucGFyZW50Tm9kZSA/PyBub2RlMlJvb3QucGFyZW50Tm9kZSkge1xuICAgICAgbm9kZTFSb290ID0gbm9kZTFSb290LnBhcmVudE5vZGVcbiAgICAgICAgPyAobm9kZTFIaWVyYXJjaHkucHVzaChub2RlMVJvb3QucGFyZW50Tm9kZSksIG5vZGUxUm9vdC5wYXJlbnROb2RlKVxuICAgICAgICA6IG5vZGUxUm9vdDtcbiAgICAgIG5vZGUyUm9vdCA9IG5vZGUyUm9vdC5wYXJlbnROb2RlXG4gICAgICAgID8gKG5vZGUySGllcmFyY2h5LnB1c2gobm9kZTJSb290LnBhcmVudE5vZGUpLCBub2RlMlJvb3QucGFyZW50Tm9kZSlcbiAgICAgICAgOiBub2RlMlJvb3Q7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhleSBkb24ndCBzaGFyZSB0aGUgc2FtZSByb290IG5vZGVcbiAgICBpZiAobm9kZTFSb290ICE9PSBub2RlMlJvb3QpIHtcbiAgICAgIHJldHVybiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0RJU0NPTk5FQ1RFRCB8XG4gICAgICAgIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fSU1QTEVNRU5UQVRJT05fU1BFQ0lGSUMgfFxuICAgICAgICBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX1BSRUNFRElORztcbiAgICB9XG5cbiAgICBjb25zdCBsb25nZXJIaWVyYXJjaHkgPSBub2RlMUhpZXJhcmNoeS5sZW5ndGggPiBub2RlMkhpZXJhcmNoeS5sZW5ndGhcbiAgICAgID8gbm9kZTFIaWVyYXJjaHlcbiAgICAgIDogbm9kZTJIaWVyYXJjaHk7XG4gICAgY29uc3Qgc2hvcnRlckhpZXJhcmNoeSA9IGxvbmdlckhpZXJhcmNoeSA9PT0gbm9kZTFIaWVyYXJjaHlcbiAgICAgID8gbm9kZTJIaWVyYXJjaHlcbiAgICAgIDogbm9kZTFIaWVyYXJjaHk7XG5cbiAgICAvLyBDaGVjayBpZiBlaXRoZXIgaXMgYSBjb250YWluZXIgb2YgdGhlIG90aGVyXG4gICAgaWYgKFxuICAgICAgbG9uZ2VySGllcmFyY2h5W2xvbmdlckhpZXJhcmNoeS5sZW5ndGggLSBzaG9ydGVySGllcmFyY2h5Lmxlbmd0aF0gPT09XG4gICAgICAgIHNob3J0ZXJIaWVyYXJjaHlbMF1cbiAgICApIHtcbiAgICAgIHJldHVybiBsb25nZXJIaWVyYXJjaHkgPT09IG5vZGUxSGllcmFyY2h5XG4gICAgICAgIC8vIG90aGVyIGlzIGEgY2hpbGQgb2YgdGhpc1xuICAgICAgICA/IE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZIHwgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkdcbiAgICAgICAgLy8gdGhpcyBpcyBhIGNoaWxkIG9mIG90aGVyXG4gICAgICAgIDogTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9DT05UQUlOUyB8IE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HO1xuICAgIH1cblxuICAgIC8vIEZpbmQgdGhlaXIgZmlyc3QgY29tbW9uIGFuY2VzdG9yIGFuZCBzZWUgd2hldGhlciB0aGV5XG4gICAgLy8gYXJlIHByZWNlZGluZyBvciBmb2xsb3dpbmdcbiAgICBjb25zdCBsb25nZXJTdGFydCA9IGxvbmdlckhpZXJhcmNoeS5sZW5ndGggLSBzaG9ydGVySGllcmFyY2h5Lmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gc2hvcnRlckhpZXJhcmNoeS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3Qgc2hvcnRlckhpZXJhcmNoeU5vZGUgPSBzaG9ydGVySGllcmFyY2h5W2ldO1xuICAgICAgY29uc3QgbG9uZ2VySGllcmFyY2h5Tm9kZSA9IGxvbmdlckhpZXJhcmNoeVtsb25nZXJTdGFydCArIGldO1xuXG4gICAgICAvLyBXZSBmb3VuZCB0aGUgZmlyc3QgY29tbW9uIGFuY2VzdG9yXG4gICAgICBpZiAobG9uZ2VySGllcmFyY2h5Tm9kZSAhPT0gc2hvcnRlckhpZXJhcmNoeU5vZGUpIHtcbiAgICAgICAgY29uc3Qgc2libGluZ3MgPSBzaG9ydGVySGllcmFyY2h5Tm9kZS5wYXJlbnROb2RlIVxuICAgICAgICAgIC5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgc2libGluZ3MuaW5kZXhPZihzaG9ydGVySGllcmFyY2h5Tm9kZSkgPFxuICAgICAgICAgICAgc2libGluZ3MuaW5kZXhPZihsb25nZXJIaWVyYXJjaHlOb2RlKVxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBTaG9ydGVyIGlzIGJlZm9yZSBsb25nZXJcbiAgICAgICAgICBpZiAoc2hvcnRlckhpZXJhcmNoeSA9PT0gbm9kZTFIaWVyYXJjaHkpIHtcbiAgICAgICAgICAgIC8vIE90aGVyIGlzIGJlZm9yZSB0aGlzXG4gICAgICAgICAgICByZXR1cm4gTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9QUkVDRURJTkc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYmVmb3JlIG90aGVyXG4gICAgICAgICAgICByZXR1cm4gTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIExvbmdlciBpcyBiZWZvcmUgc2hvcnRlclxuICAgICAgICAgIGlmIChsb25nZXJIaWVyYXJjaHkgPT09IG5vZGUxSGllcmFyY2h5KSB7XG4gICAgICAgICAgICAvLyBPdGhlciBpcyBiZWZvcmUgdGhpc1xuICAgICAgICAgICAgcmV0dXJuIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPdGhlciBpcyBhZnRlciB0aGlzXG4gICAgICAgICAgICByZXR1cm4gTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRklYTUU6IFNob3VsZCBwcm9iYWJseSB0aHJvdyBoZXJlIGJlY2F1c2UgdGhpc1xuICAgIC8vIHBvaW50IHNob3VsZCBiZSB1bnJlYWNoYWJsZSBjb2RlIGFzIHBlciB0aGVcbiAgICAvLyBpbnRlbmRlZCBsb2dpY1xuICAgIHJldHVybiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0ZPTExPV0lORztcbiAgfVxuXG4gIGdldFJvb3ROb2RlKG9wdHM6IHsgY29tcG9zZWQ/OiBib29sZWFuIH0gPSB7fSk6IE5vZGUge1xuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcmVudE5vZGUuZ2V0Um9vdE5vZGUob3B0cyk7XG4gICAgfVxuICAgIGlmIChvcHRzLmNvbXBvc2VkICYmICh0aGlzIGFzIGFueSkuaG9zdCkge1xuICAgICAgcmV0dXJuICh0aGlzIGFzIGFueSkuaG9zdC5nZXRSb290Tm9kZShvcHRzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLy8gTm9kZSBpbnN0YW5jZSBgbm9kZVR5cGVgIGVudW0gY29uc3RhbnRzXG5leHBvcnQgaW50ZXJmYWNlIE5vZGUge1xuICBFTEVNRU5UX05PREU6IE5vZGVUeXBlO1xuICBBVFRSSUJVVEVfTk9ERTogTm9kZVR5cGU7XG4gIFRFWFRfTk9ERTogTm9kZVR5cGU7XG4gIENEQVRBX1NFQ1RJT05fTk9ERTogTm9kZVR5cGU7XG4gIEVOVElUWV9SRUZFUkVOQ0VfTk9ERTogTm9kZVR5cGU7XG4gIEVOVElUWV9OT0RFOiBOb2RlVHlwZTtcbiAgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFOiBOb2RlVHlwZTtcbiAgQ09NTUVOVF9OT0RFOiBOb2RlVHlwZTtcbiAgRE9DVU1FTlRfTk9ERTogTm9kZVR5cGU7XG4gIERPQ1VNRU5UX1RZUEVfTk9ERTogTm9kZVR5cGU7XG4gIERPQ1VNRU5UX0ZSQUdNRU5UX05PREU6IE5vZGVUeXBlO1xuICBOT1RBVElPTl9OT0RFOiBOb2RlVHlwZTtcbn1cblxuTm9kZS5wcm90b3R5cGUuRUxFTUVOVF9OT0RFID0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFO1xuTm9kZS5wcm90b3R5cGUuQVRUUklCVVRFX05PREUgPSBOb2RlVHlwZS5BVFRSSUJVVEVfTk9ERTtcbk5vZGUucHJvdG90eXBlLlRFWFRfTk9ERSA9IE5vZGVUeXBlLlRFWFRfTk9ERTtcbk5vZGUucHJvdG90eXBlLkNEQVRBX1NFQ1RJT05fTk9ERSA9IE5vZGVUeXBlLkNEQVRBX1NFQ1RJT05fTk9ERTtcbk5vZGUucHJvdG90eXBlLkVOVElUWV9SRUZFUkVOQ0VfTk9ERSA9IE5vZGVUeXBlLkVOVElUWV9SRUZFUkVOQ0VfTk9ERTtcbk5vZGUucHJvdG90eXBlLkVOVElUWV9OT0RFID0gTm9kZVR5cGUuRU5USVRZX05PREU7XG5Ob2RlLnByb3RvdHlwZS5QUk9DRVNTSU5HX0lOU1RSVUNUSU9OX05PREUgPVxuICBOb2RlVHlwZS5QUk9DRVNTSU5HX0lOU1RSVUNUSU9OX05PREU7XG5Ob2RlLnByb3RvdHlwZS5DT01NRU5UX05PREUgPSBOb2RlVHlwZS5DT01NRU5UX05PREU7XG5Ob2RlLnByb3RvdHlwZS5ET0NVTUVOVF9OT0RFID0gTm9kZVR5cGUuRE9DVU1FTlRfTk9ERTtcbk5vZGUucHJvdG90eXBlLkRPQ1VNRU5UX1RZUEVfTk9ERSA9IE5vZGVUeXBlLkRPQ1VNRU5UX1RZUEVfTk9ERTtcbk5vZGUucHJvdG90eXBlLkRPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSBOb2RlVHlwZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFO1xuTm9kZS5wcm90b3R5cGUuTk9UQVRJT05fTk9ERSA9IE5vZGVUeXBlLk5PVEFUSU9OX05PREU7XG5cbmV4cG9ydCBjbGFzcyBDaGFyYWN0ZXJEYXRhIGV4dGVuZHMgTm9kZSB7XG4gICNub2RlVmFsdWUgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGRhdGE6IHN0cmluZyxcbiAgICBub2RlTmFtZTogc3RyaW5nLFxuICAgIG5vZGVUeXBlOiBOb2RlVHlwZSxcbiAgICBwYXJlbnROb2RlOiBOb2RlIHwgbnVsbCxcbiAgICBrZXk6IHR5cGVvZiBDVE9SX0tFWSxcbiAgKSB7XG4gICAgc3VwZXIoXG4gICAgICBub2RlTmFtZSxcbiAgICAgIG5vZGVUeXBlLFxuICAgICAgcGFyZW50Tm9kZSxcbiAgICAgIGtleSxcbiAgICApO1xuXG4gICAgdGhpcy4jbm9kZVZhbHVlID0gZGF0YTtcbiAgfVxuXG4gIGdldCBub2RlVmFsdWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbm9kZVZhbHVlO1xuICB9XG5cbiAgc2V0IG5vZGVWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgdGhpcy4jbm9kZVZhbHVlID0gU3RyaW5nKHZhbHVlID8/IFwiXCIpO1xuICB9XG5cbiAgZ2V0IGRhdGEoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbm9kZVZhbHVlO1xuICB9XG5cbiAgc2V0IGRhdGEodmFsdWU6IGFueSkge1xuICAgIHRoaXMubm9kZVZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdGV4dENvbnRlbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbm9kZVZhbHVlO1xuICB9XG5cbiAgc2V0IHRleHRDb250ZW50KHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLm5vZGVWYWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoO1xuICB9XG5cbiAgYmVmb3JlKC4uLm5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSkge1xuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIGluc2VydEJlZm9yZUFmdGVyKHRoaXMsIG5vZGVzLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICBhZnRlciguLi5ub2RlczogKE5vZGUgfCBzdHJpbmcpW10pIHtcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICBpbnNlcnRCZWZvcmVBZnRlcih0aGlzLCBub2RlcywgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSgpIHtcbiAgICB0aGlzLl9yZW1vdmUoKTtcbiAgfVxuXG4gIHJlcGxhY2VXaXRoKC4uLm5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSkge1xuICAgIHRoaXMuX3JlcGxhY2VXaXRoKC4uLm5vZGVzKTtcbiAgfVxuXG4gIC8vIFRPRE86IEltcGxlbWVudCBOb25Eb2N1bWVudFR5cGVDaGlsZE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nLCBldGNcbiAgLy8gcmVmOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2hhcmFjdGVyRGF0YVxufVxuXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIENoYXJhY3RlckRhdGEge1xuICBjb25zdHJ1Y3RvcihcbiAgICB0ZXh0OiBzdHJpbmcgPSBcIlwiLFxuICApIHtcbiAgICBzdXBlcihcbiAgICAgIFN0cmluZyh0ZXh0KSxcbiAgICAgIFwiI3RleHRcIixcbiAgICAgIE5vZGVUeXBlLlRFWFRfTk9ERSxcbiAgICAgIG51bGwsXG4gICAgICBDVE9SX0tFWSxcbiAgICApO1xuICB9XG5cbiAgX3NoYWxsb3dDbG9uZSgpOiBOb2RlIHtcbiAgICByZXR1cm4gbmV3IFRleHQodGhpcy50ZXh0Q29udGVudCk7XG4gIH1cblxuICBnZXQgdGV4dENvbnRlbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gPHN0cmluZz4gdGhpcy5ub2RlVmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbW1lbnQgZXh0ZW5kcyBDaGFyYWN0ZXJEYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgdGV4dDogc3RyaW5nID0gXCJcIixcbiAgKSB7XG4gICAgc3VwZXIoXG4gICAgICBTdHJpbmcodGV4dCksXG4gICAgICBcIiNjb21tZW50XCIsXG4gICAgICBOb2RlVHlwZS5DT01NRU5UX05PREUsXG4gICAgICBudWxsLFxuICAgICAgQ1RPUl9LRVksXG4gICAgKTtcbiAgfVxuXG4gIF9zaGFsbG93Q2xvbmUoKTogTm9kZSB7XG4gICAgcmV0dXJuIG5ldyBDb21tZW50KHRoaXMudGV4dENvbnRlbnQpO1xuICB9XG5cbiAgZ2V0IHRleHRDb250ZW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIDxzdHJpbmc+IHRoaXMubm9kZVZhbHVlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxRQUFRLFFBQVEseUJBQXlCO0FBQ2xELFNBQVMsUUFBUSxFQUFtQixrQkFBa0IsUUFBUSxpQkFBaUI7QUFDL0UsU0FDRSxpQkFBaUIsRUFDakIsa0JBQWtCLEVBQ2xCLDRCQUE0QixRQUN2QixhQUFhOztVQUtSOzs7Ozs7Ozs7Ozs7O0dBQUEsYUFBQTtBQWVaOzs7Q0FHQyxHQUNELE9BQU8sTUFBTSxvQkFBb0IsQ0FDL0IsT0FDQTtFQUVBLE9BQU8sTUFBTSxPQUFPLENBQUMsQ0FBQztJQUNwQixJQUFJLG1CQUFtQixJQUFZO01BQ2pDLE1BQU0sV0FBVyxNQUFNLElBQUksQ0FBQyxBQUFDLEVBQVcsVUFBVTtN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