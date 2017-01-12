(function(){
  
  // #定義系
  function extend(o, p) {
    for(var k in p) o[k] = p[k];
    return o;
  }
  
  function def(f, proto, _static) {
    proto = proto || {};
    _static = _static || {};
    extend(f.prototype, proto);
    extend(f, _static);
    return f;
  }
  
  var DOM = def(function(dom){
    var t = typeof dom;
    if(t === 'string'){
      return DOM.query(dom);
    }
    if(t === null) {
      return DOM.create('div');
    }
    this.dom = dom;
  }, {
    text: function(text){
      if(typeof text === 'string'){
        this.dom.textContent = text;
        return this;
      }
      return this.dom.textContent;
    },
    
    val: function(v){
      if(typeof v === 'string'){
        this.dom.value = v;
        return this;
      }
      return this.dom.value;
    },
    
    attr: function(o){
      extend(this.dom, o);
      return this;
    },
    style: function(o){
      if(o){
        extend(this.dom.style, o);
        return this;
      }
      else {
        return this.dom.style;
      }
    },
    
    append: function(child){
      if(!child.dom){
        child = new Elm(child);
      }
      this.dom.appendChild(child.dom);
      return this;
    },
    
    appendTo: function(parent){
      if(!parent.dom){
        parent = new Elm(parent);
      }
      parent.append(this);
      return this;
    },
    
    removeChildAll: function(){
      var dom = this.dom;
      var c;
      while(c = dom.firstChild){
        dom.removeChild(c);
      }
      return this;
    },
  }, {
    id: function(id){
      return new DOM(document.getElementById(id));
    },
    
    query: function(q){
      return new DOM(document.querySelector(q));
    },
    
    create: function(tag){
      return new DOM(document.createElement(tag));
    }
    
  });
  
  var Elm = def(function(tagName) {
    this._attr = {};
    this._style = {};
    this.children = [];
    this.tagName = tagName;
    this.parent = null;
  },{
    attr: function(o){
      extend(this._attr, o);
      return this;
    },
    
    style: function(o){
      if(o){
        extend(this._style, o);
        return this;
      }
      return this._style;
    },
    
    add: function(elm){
      this.children.push(elm);
      elm.parent = this;
      return this;
    },
    
    addTo: function(parent){
      parent.add(this);
      this.parent = parent;
      return this;
    },
    
    remove: function(){
      this.parent.removeChild(this);
      return this;
    },
    
    removeChild: function(c){
      c.parent = null;
      var i = this.children.indexOf(c);
      this.children.splice(i, 1);
      return this;
    },
    
    toDom: function(){
      var dom = DOM.create(this.tagName || 'div');
      dom.attr(this._attr).style(this._style);
      this.children.forEach(function(child){
        dom.append(child.toDom());
      });
      return dom;
    },
    
    update: function(){
      this.target.removeChildAll().append(this.toDom());
      return this;
    },
    
    setTarget: function(target){
      if(!(target instanceof DOM)){
        target = new DOM(target);
      }
      this.target = target;
      return this;
    },
    
    clone: function(){
      var elm = Elm(this.tagName);
      elm.attr(this._attr).style(this._style);
      elm.children = this.children.slice(0);
      return elm;
    }
    
  });
  
  var Todo = def(function(text){
    Elm.call(this, 'li');
    this.span = new Elm('span').attr({textContent: text || ''});
    this.add(this.span);
  }, extend({
    change: function(text){},
    delete: function(){},
    check: function(){},
    isChecked: function(){},
  }, Elm.prototype));
  
  // #main
  var todoList = new Elm('ol').setTarget('#todoList');
  var createInput = DOM.id('createInput').attr({
    onkeydown: function(e){
      if(e.keyCode === 13){
        e.preventDefault();
        createTODO(this.value);
        this.value = '';
      }
    }
  });
  
  DOM.id('createButton').attr({
    onclick: function(){
      createTODO(createInput.val());
      createInput.val('');
    }
  });
  
  function createTODO(text){
    todoList.add(new Todo(text));
    todoList.update();
  }
  
})();