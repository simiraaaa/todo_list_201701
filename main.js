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
  
  function Proto(superClass, proto){
    return extend(Object.create(superClass.prototype), proto || {});
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
    
    removeAttributeAll: function(){
      var dom = this.dom;
      if(dom.hasAttributes()) {
        var attrNames = [].map.call(dom.attributes, function(a){
          return a.name;
        });
        attrNames.forEach(function(n){
          dom.removeAttribute(n);
        });
      }
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
    
    removeStyleAll: function(){
      var style = this.dom.style;
      if(style.length > 0) {
        var names = [].slice.call(style, 0);
        names.forEach(function(n){
          style.removeProperty(n);
        });
      }
      return this;
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
    this.dom = null;
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
    
    removeChildAll: function(){
      this.children.length = 0;
      return this;
    },
    
    toDom: function(){
      var dom = DOM.create(this.tagName || 'div');
      dom.attr(this._attr).style(this._style);
      this.children.forEach(function(child){
        dom.append(child.toDom());
      });
      this.dom = dom;
      return dom;
    },
    
    update: function(){
      this.target.removeChildAll().append(this.toDom());
      return this;
    },
    
    updateDOM: function(childUpdate){
      var dom = this.dom;
      if(!dom){
        return this;
      }
      if(!(dom instanceof DOM)) {
        dom = new DOM(dom);
      }
      
      if(childUpdate !== false) {
        dom.removeChildAll();
        this.children.forEach(function(c){
          dom.append(c.toDom());
        });
      }
      dom
      .removeAttributeAll()
      .removeStyleAll()
      .attr(this._attr)
      .style(this._style);
      
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
    },
    
    fromJSON: function(json){
      if(typeof json === 'string'){
        json = JSON.parse(json);
      }
      json.forEach(function(o){
        var elm = new Elm(o.tagName).attr(o.attr || {}).style(o.style || {});
        if(o.name) {
          this[o.name] = elm;
        }
        if(o.children) {
          elm.fromJSON(o.children);
        }
        
        this.add(elm);
      }, this);
      
      return this;
    },
    
  }, {
    fromJSON: function(json){
      var elm = new Elm();
      return elm.fromJSON(json);
    }
  });
  
  // #main
  var STORAGE_KEY = 'todolist201701';
  
  
  var Todo = def(function(text){
    Elm.call(this, 'li');
    var self = this;
    this.fromJSON([
      {
        name: 'checkbox',
        tagName: 'input',
        attr: {
          type: 'checkbox',
          onchange: function(){
            if(this.checked) {
              self.check();
            }
            else {
              self.uncheck();
            }
            save();
          }
        },
      },
      {
        tagName: 'span',
        name: 'span',
        attr: {
          textContent: text,
          onclick: function(){
            this.contentEditable = true;
          },
          onkeydown: function(e){
            if(e.keyCode === 13){
              e.preventDefault();
              this.contentEditable = false;
              self.change(this.textContent);
            }
          }
        },
        style: {padding: '0 10px'}
      }
    ]);
  }, Proto(Elm, {
    getText: function(){
      return this.span._attr.textContent;
    },
    change: function(text, update){
      this.span.attr({textContent: text});
      if(update) {
        this.span.updateDOM();
      }
      save();
      return this;
    },
    delete: function(){},
    check: function(){
      this.span.style({
        textDecoration: 'line-through'
      }).updateDOM();
      this.checkbox.attr({checked: true}).updateDOM(false);
      return this;
    },
    uncheck: function(){
      this.span.style({
        textDecoration: ''
      }).updateDOM();
      this.checkbox.attr({checked: false}).updateDOM(false);
      return this;
    },
    isChecked: function(){
      return this.checkbox._attr.checked;
    },
  }));
  
  
  var todoList = new Elm('ol').setTarget('#todoList');
  
  todoList.toJSON = function(){
    return this.children.map(function(child){
      return {
        text: child.getText(),
        check: child.isChecked(),
      };
    });
  };
  
  todoList.fromJSON = function(json){
    if(!json) return this;
    if(typeof json === 'string'){
      json = JSON.parse(json);
    }
    var self = this;
    json.forEach(function(o){
      var todo = new Todo(o.text);
      if(o.check) todo.check();
      self.add(todo);
    });
    
    return this;
  };
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
    save();
  }
  
  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todoList));
  }
  
  function load(){
    todoList.removeChildAll();
    todoList.fromJSON(localStorage.getItem(STORAGE_KEY)).update();
  }
  
  load();
  
})();