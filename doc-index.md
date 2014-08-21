### Introduction

This site contains the documentation for **ShiViz**, a tool for visualizing executions of distributed systems.

* [Try out the web deployment!](http://bestchai.bitbucket.org/shiviz/)

* [Read more](https://bitbucket.org/bestchai/shiviz/wiki/) about how ShiViz works.

* Check out [ShiVector](https://bitbucket.org/bestchai/shivector/wiki/), a tool
  to convert existing logs into a ShiViz-supported format.

<br/>

---
### Important Information

[AbstractGraph](./AbstractGraph.html) and [AbstractNode](./AbstractNode.html) contain the key graph model for Shiviz. Make sure you understand how those two classes work. Pay special attention to the definition of terms in AbstractNode, as they are used thoughout the other classes as well.

<br/>

---
### Coding Conventions

#### Exceptions
You should never throw anything other than [Exceptions](./Exception.html). However, since Javascript itself and external libraries such as JQuery are still free to throw whatever they want, do not expect that catch-statements will only catch Exceptions.

#### Class, Method and Field Declarations
Classes, methods and fields should be declared in a specific way that's best explained by example:

    // Constructor for MyClass
    function MyClass(param0) {
        this.instanceField = 123; // declares and initializes a field belonging to MyClass objects

        // rest of the constructor go here
    }

    MyClass.staticField = "asdf";

    MyClass.staticMethod = function(param0) {
        // Do something here
    }
    
    MyClass.prototype.instanceMethod = function(param0) {
        // Do something here
    }


Typically, each class is declared in its own file. Exceptions are made for small classes that have an unsubstantial amount of code such as the classes in [graphEvent.js](./graphEvent.js.html).

By convention, the constructor of a class should preceed all of its field and method declarations. Note that instance fields are declared and initialized inside the constructor itself. By convention, these instance field declarations should preceed other code in the constructor

#### Inheritance
To have `Subclass` inherit from `ParentClass`, use the following:

    Subclass.prototype = Object.create(ParentClass.prototype);
    Subclass.prototype.constructor = Subclass;

Shiviz will run fine no matter where you put that code snippet, but for consistency and readability's sake, it should be inserted right after Subclass's constructor. Subclass will now be able to invoke any of the methods declared in ParentClass directly. The constructor is a special case; to invoke the constructor, use:

    ParentClass.call(this, param1, param2, param3);

To call the overriden method `foo` in the super-class (the equivalent of `super.foo(param1, param2, param3)` in other languages), use:

    ParentClass.prototype.foo.call(this, param1, param2, param3);

For an example of some of this, see [the source code for BuilderNode](./builderNode.js.html).

#### Abstract Classes
There is no language-level support for abstract classes. The convention is to manually prevent instantiation of abstract classes with the following piece of code in the constructor of an abstract class:

    if (this.constructor == SomeAbstractClass) {
        throw new Exception("Cannot instantiate SomeAbstractClass; SomeAbstractClass is an abstract class");
    }

Note that this will still allow subclasses of SomeAbstractClass to invoke SomeAbstractClass's constructor using `SomeAbstractClass.call(this)`.

#### Access modifiers
There is no language level support for access modifiers such as public, private and protected. If you want to make a field or method private or protected, you should mark it as such using JSDoc comments. These access modifiers, although not enforced at a language level, should be respected when writing code (e.g don't access something marked private)

#### Getters and Setters
Usually, one would access fields of an object through its getters and setters (except possibly for debugging purposes). This means that for fields in a class, it is recommended that you write getters and setters for that field if you want to permit other classes to modify or access that field.

#### Sets and Maps
Raw objects are commonly used as maps in Shiviz. For example:

    var map = {}; // creates a new map
    map["aaa"] = 3; // maps key=aaa to value=3
    map["bbb"] = "foo" // maps key=bbb to value=foo
    console.log(map["aaa"]); // prints the value associated with key aaa
    delete map["bbb"]; // removes key bbb and its associated value from the map
    if(map["aaa"]) { ... } // does something if key aaa exists in the map

Note that ONLY strings can act as keys in a raw object map. Anything key that's not a string will be converted to one by javascript. There are no restrictions on what the value can be.

In addition, raw objects are also used as sets. For example:

    var set = {}; // creates a set
    set["aaa"] = true; // puts aaa into the set
    set["bbb"] = true; // puts bbb into the set
    delete set["bbb"]; // removes bbb from the set
    if(set["aaa"]) { ... } // does something if aaa is in the set

Again, keep in mind that only strings can be inserted into the set like this. Also note that the convention in Shiviz is to map things to true as in lines two and three above

#### Null, Undefined, and False
In javascript, `null`, `undefined`, and `false` are all considered "falsey"; they will all become `false` when cast to a boolean. This allows one to write code such as

    if(!someVar) {
        // This if-statement body will run in someVar is falsey. So someVar could be either null, undefined, or false (among other things)
    }

Please keep the following things in mind with respect to this behavior:
* You can cast a variable to a boolean using "!!" (e.g !!someVar will cast someVar to an ACTUAL boolean)
* Publicly accessible fields/methods should return exactly what's specified. For example, if a method is documented to return false, it should not return null, even though they are both falsey.
* No publicly accessible field should ever be undefined. 
* If a method doesn't return anything (void in other languages), that method automatically returns `undefined`. A method should never explicitly return a value of `undefined` (i.e with the return statement).

Consider the following:

    // BAD! this will return `true` if "foo" is in the set and `undefined` otherwise
    function setHasFoo(set) {
        return set["foo"];
    }

    // GOOD! this will return `true` if "foo" is in the set and `false` otherwise
    function setHasFoo(set) {
        return !!set["foo"]; 
    }

