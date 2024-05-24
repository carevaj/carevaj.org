import { Element } from "../element.ts";
import { DocumentFragment } from "../document-fragment.ts";
import { getElementAttributesString, getOuterOrInnerHtml } from "../utils.ts";
import { fragmentNodesFromString } from "../../deserialize.ts";
import { CTOR_KEY } from "../../constructor-lock.ts";
export class HTMLTemplateElement extends Element {
  /**
   * This blocks access to the .#contents property when the
   * super() constructor is running which invokes (our
   * overridden) _setParent() method. Without it, we get
   * the following error thrown:
   *
   *   TypeError: Cannot read private member #content from
   *   an object whose class did not declare it
   *
   * FIXME: Maybe find a cleaner way to do this
   */ __contentIsSet = false;
  #content = null;
  constructor(parentNode, attributes, key, content){
    super("TEMPLATE", parentNode, attributes, key);
    this.#content = content;
    this.__contentIsSet = true;
  }
  get content() {
    return this.#content;
  }
  _setOwnerDocument(document) {
    super._setOwnerDocument(document);
    if (this.__contentIsSet) {
      this.content._setOwnerDocument(document);
    }
  }
  _shallowClone() {
    const frag = new DocumentFragment();
    const attributes = this.getAttributeNames().map((name)=>[
        name,
        this.getAttribute(name)
      ]);
    return new HTMLTemplateElement(null, attributes, CTOR_KEY, frag);
  }
  cloneNode(deep = false) {
    const newNode = super.cloneNode(deep);
    if (deep) {
      const destContent = newNode.content;
      for (const child of this.content.childNodes){
        destContent.appendChild(child.cloneNode(deep));
      }
    }
    return newNode;
  }
  get innerHTML() {
    return getOuterOrInnerHtml(this, false);
  }
  // Replace children in the `.content`
  set innerHTML(html) {
    const content = this.content;
    // Remove all children
    for (const child of content.childNodes){
      child._setParent(null);
    }
    const mutator = content._getChildNodesMutator();
    mutator.splice(0, content.childNodes.length);
    // Parse HTML into new children
    if (html.length) {
      const parsed = fragmentNodesFromString(html, this.localName);
      mutator.push(...parsed.childNodes[0].childNodes);
      for (const child of content.childNodes){
        child._setParent(content);
        child._setOwnerDocument(content.ownerDocument);
      }
    }
  }
  get outerHTML() {
    return `<template${getElementAttributesString(this)}>${this.innerHTML}</template>`;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40NS9zcmMvZG9tL2VsZW1lbnRzL2h0bWwtdGVtcGxhdGUtZWxlbWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4uL25vZGUudHNcIjtcbmltcG9ydCB7IEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC50c1wiO1xuaW1wb3J0IHsgRG9jdW1lbnQgfSBmcm9tIFwiLi4vZG9jdW1lbnQudHNcIjtcbmltcG9ydCB7IERvY3VtZW50RnJhZ21lbnQgfSBmcm9tIFwiLi4vZG9jdW1lbnQtZnJhZ21lbnQudHNcIjtcbmltcG9ydCB7IGdldEVsZW1lbnRBdHRyaWJ1dGVzU3RyaW5nLCBnZXRPdXRlck9ySW5uZXJIdG1sIH0gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBmcmFnbWVudE5vZGVzRnJvbVN0cmluZyB9IGZyb20gXCIuLi8uLi9kZXNlcmlhbGl6ZS50c1wiO1xuaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTFRlbXBsYXRlRWxlbWVudCBleHRlbmRzIEVsZW1lbnQge1xuICAvKipcbiAgICogVGhpcyBibG9ja3MgYWNjZXNzIHRvIHRoZSAuI2NvbnRlbnRzIHByb3BlcnR5IHdoZW4gdGhlXG4gICAqIHN1cGVyKCkgY29uc3RydWN0b3IgaXMgcnVubmluZyB3aGljaCBpbnZva2VzIChvdXJcbiAgICogb3ZlcnJpZGRlbikgX3NldFBhcmVudCgpIG1ldGhvZC4gV2l0aG91dCBpdCwgd2UgZ2V0XG4gICAqIHRoZSBmb2xsb3dpbmcgZXJyb3IgdGhyb3duOlxuICAgKlxuICAgKiAgIFR5cGVFcnJvcjogQ2Fubm90IHJlYWQgcHJpdmF0ZSBtZW1iZXIgI2NvbnRlbnQgZnJvbVxuICAgKiAgIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcbiAgICpcbiAgICogRklYTUU6IE1heWJlIGZpbmQgYSBjbGVhbmVyIHdheSB0byBkbyB0aGlzXG4gICAqL1xuICBwcml2YXRlIF9fY29udGVudElzU2V0ID0gZmFsc2U7XG4gICNjb250ZW50OiBEb2N1bWVudEZyYWdtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcGFyZW50Tm9kZTogTm9kZSB8IG51bGwsXG4gICAgYXR0cmlidXRlczogW3N0cmluZywgc3RyaW5nXVtdLFxuICAgIGtleTogdHlwZW9mIENUT1JfS0VZLFxuICAgIGNvbnRlbnQ6IERvY3VtZW50RnJhZ21lbnQsXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgXCJURU1QTEFURVwiLFxuICAgICAgcGFyZW50Tm9kZSxcbiAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICBrZXksXG4gICAgKTtcblxuICAgIHRoaXMuI2NvbnRlbnQgPSBjb250ZW50O1xuICAgIHRoaXMuX19jb250ZW50SXNTZXQgPSB0cnVlO1xuICB9XG5cbiAgZ2V0IGNvbnRlbnQoKTogRG9jdW1lbnRGcmFnbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuI2NvbnRlbnQhO1xuICB9XG5cbiAgb3ZlcnJpZGUgX3NldE93bmVyRG9jdW1lbnQoZG9jdW1lbnQ6IERvY3VtZW50IHwgbnVsbCkge1xuICAgIHN1cGVyLl9zZXRPd25lckRvY3VtZW50KGRvY3VtZW50KTtcblxuICAgIGlmICh0aGlzLl9fY29udGVudElzU2V0KSB7XG4gICAgICB0aGlzLmNvbnRlbnQuX3NldE93bmVyRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIF9zaGFsbG93Q2xvbmUoKTogSFRNTFRlbXBsYXRlRWxlbWVudCB7XG4gICAgY29uc3QgZnJhZyA9IG5ldyBEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHRoaXNcbiAgICAgIC5nZXRBdHRyaWJ1dGVOYW1lcygpXG4gICAgICAubWFwKChuYW1lKSA9PiBbbmFtZSwgdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSkhXSBhcyBbc3RyaW5nLCBzdHJpbmddKTtcbiAgICByZXR1cm4gbmV3IEhUTUxUZW1wbGF0ZUVsZW1lbnQobnVsbCwgYXR0cmlidXRlcywgQ1RPUl9LRVksIGZyYWcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgY2xvbmVOb2RlKGRlZXAgPSBmYWxzZSk6IEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xuICAgIGNvbnN0IG5ld05vZGUgPSBzdXBlci5jbG9uZU5vZGUoZGVlcCkgYXMgSFRNTFRlbXBsYXRlRWxlbWVudDtcblxuICAgIGlmIChkZWVwKSB7XG4gICAgICBjb25zdCBkZXN0Q29udGVudCA9IG5ld05vZGUuY29udGVudDtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jb250ZW50LmNoaWxkTm9kZXMpIHtcbiAgICAgICAgZGVzdENvbnRlbnQuYXBwZW5kQ2hpbGQoY2hpbGQuY2xvbmVOb2RlKGRlZXApKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Tm9kZTtcbiAgfVxuXG4gIGdldCBpbm5lckhUTUwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gZ2V0T3V0ZXJPcklubmVySHRtbCh0aGlzLCBmYWxzZSk7XG4gIH1cblxuICAvLyBSZXBsYWNlIGNoaWxkcmVuIGluIHRoZSBgLmNvbnRlbnRgXG4gIHNldCBpbm5lckhUTUwoaHRtbDogc3RyaW5nKSB7XG4gICAgY29uc3QgY29udGVudCA9IHRoaXMuY29udGVudDtcblxuICAgIC8vIFJlbW92ZSBhbGwgY2hpbGRyZW5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNvbnRlbnQuY2hpbGROb2Rlcykge1xuICAgICAgY2hpbGQuX3NldFBhcmVudChudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBtdXRhdG9yID0gY29udGVudC5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcbiAgICBtdXRhdG9yLnNwbGljZSgwLCBjb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoKTtcblxuICAgIC8vIFBhcnNlIEhUTUwgaW50byBuZXcgY2hpbGRyZW5cbiAgICBpZiAoaHRtbC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IGZyYWdtZW50Tm9kZXNGcm9tU3RyaW5nKGh0bWwsIHRoaXMubG9jYWxOYW1lKTtcbiAgICAgIG11dGF0b3IucHVzaCguLi5wYXJzZWQuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzKTtcblxuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjb250ZW50LmNoaWxkTm9kZXMpIHtcbiAgICAgICAgY2hpbGQuX3NldFBhcmVudChjb250ZW50KTtcbiAgICAgICAgY2hpbGQuX3NldE93bmVyRG9jdW1lbnQoY29udGVudC5vd25lckRvY3VtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgb3V0ZXJIVE1MKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8dGVtcGxhdGUke1xuICAgICAgZ2V0RWxlbWVudEF0dHJpYnV0ZXNTdHJpbmcodGhpcylcbiAgICB9PiR7dGhpcy5pbm5lckhUTUx9PC90ZW1wbGF0ZT5gO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxPQUFPLFFBQVEsZ0JBQWdCO0FBRXhDLFNBQVMsZ0JBQWdCLFFBQVEsMEJBQTBCO0FBQzNELFNBQVMsMEJBQTBCLEVBQUUsbUJBQW1CLFFBQVEsY0FBYztBQUM5RSxTQUFTLHVCQUF1QixRQUFRLHVCQUF1QjtBQUMvRCxTQUFTLFFBQVEsUUFBUSw0QkFBNEI7QUFFckQsT0FBTyxNQUFNLDRCQUE0QjtFQUN2Qzs7Ozs7Ozs7OztHQVVDLEdBQ0QsQUFBUSxpQkFBaUIsTUFBTTtFQUMvQixDQUFDLE9BQU8sR0FBNEIsS0FBSztFQUV6QyxZQUNFLFVBQXVCLEVBQ3ZCLFVBQThCLEVBQzlCLEdBQW9CLEVBQ3BCLE9BQXlCLENBQ3pCO0lBQ0EsS0FBSyxDQUNILFlBQ0EsWUFDQSxZQUNBO0lBR0YsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHO0lBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUc7RUFDeEI7RUFFQSxJQUFJLFVBQTRCO0lBQzlCLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTztFQUN0QjtFQUVTLGtCQUFrQixRQUF5QixFQUFFO0lBQ3BELEtBQUssQ0FBQyxrQkFBa0I7SUFFeEIsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO01BQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7SUFDakM7RUFDRjtFQUVTLGdCQUFxQztJQUM1QyxNQUFNLE9BQU8sSUFBSTtJQUNqQixNQUFNLGFBQWEsSUFBSSxDQUNwQixpQkFBaUIsR0FDakIsR0FBRyxDQUFDLENBQUMsT0FBUztRQUFDO1FBQU0sSUFBSSxDQUFDLFlBQVksQ0FBQztPQUFPO0lBQ2pELE9BQU8sSUFBSSxvQkFBb0IsTUFBTSxZQUFZLFVBQVU7RUFDN0Q7RUFFUyxVQUFVLE9BQU8sS0FBSyxFQUF1QjtJQUNwRCxNQUFNLFVBQVUsS0FBSyxDQUFDLFVBQVU7SUFFaEMsSUFBSSxNQUFNO01BQ1IsTUFBTSxjQUFjLFFBQVEsT0FBTztNQUNuQyxLQUFLLE1BQU0sU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBRTtRQUMzQyxZQUFZLFdBQVcsQ0FBQyxNQUFNLFNBQVMsQ0FBQztNQUMxQztJQUNGO0lBRUEsT0FBTztFQUNUO0VBRUEsSUFBSSxZQUFvQjtJQUN0QixPQUFPLG9CQUFvQixJQUFJLEVBQUU7RUFDbkM7RUFFQSxxQ0FBcUM7RUFDckMsSUFBSSxVQUFVLElBQVksRUFBRTtJQUMxQixNQUFNLFVBQVUsSUFBSSxDQUFDLE9BQU87SUFFNUIsc0JBQXNCO0lBQ3RCLEtBQUssTUFBTSxTQUFTLFFBQVEsVUFBVSxDQUFFO01BQ3RDLE1BQU0sVUFBVSxDQUFDO0lBQ25CO0lBRUEsTUFBTSxVQUFVLFFBQVEscUJBQXFCO0lBQzdDLFFBQVEsTUFBTSxDQUFDLEdBQUcsUUFBUSxVQUFVLENBQUMsTUFBTTtJQUUzQywrQkFBK0I7SUFDL0IsSUFBSSxLQUFLLE1BQU0sRUFBRTtNQUNmLE1BQU0sU0FBUyx3QkFBd0IsTUFBTSxJQUFJLENBQUMsU0FBUztNQUMzRCxRQUFRLElBQUksSUFBSSxPQUFPLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVTtNQUUvQyxLQUFLLE1BQU0sU0FBUyxRQUFRLFVBQVUsQ0FBRTtRQUN0QyxNQUFNLFVBQVUsQ0FBQztRQUNqQixNQUFNLGlCQUFpQixDQUFDLFFBQVEsYUFBYTtNQUMvQztJQUNGO0VBQ0Y7RUFFQSxJQUFJLFlBQW9CO0lBQ3RCLE9BQU8sQ0FBQyxTQUFTLEVBQ2YsMkJBQTJCLElBQUksRUFDaEMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDO0VBQ2pDO0FBQ0YifQ==