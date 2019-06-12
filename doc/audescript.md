# A Short Introduction for Audescript

Audescript is a custom generalistic programming language.
The goal of this language is to be close to pseudo code notations used in
computer science courses.

This language is close to Javascript in its semantics with two main differences:

- equality is by value and not by reference, so `{1,2,3}` equals `{1,2,3}`,
  contrary to Javascript.
- sets are first class citizens and the language provides set operations like
union, intersection and cross product as operators

Main cosmetic differences are:

- No braces. Keywords are used to end blocks.
- `:=` for assignment, `=` for equality test.
- The ternary operator is `if test then value_if_true else value_is false`

Audescript is not designed to be used as a main programming language. It is
designed for students to fiddle with finite state machines.

In order to avoid having to remember too many things, several ways of writing
things are provided when it makes sense. For instance, a `if` block can be ended
using `end if` or `fi` and a `while` block can be ended using `end while`,
`end do` or `done`.

## Comments

    # This is a comment

    // This is another comment

    /* This is a multiline
       comment */

## Variable and Constant Declaration

    let variable := 0
    const answerToLife := 42

## Functions and Procedures

    function f(arg1, arg2)
        # ...
        return true
    end function

    f(1, 2)

    procedure p()
        alert(42)
    end procedure

## `if` Statement

    if condition then
        # code
    end if

    # fi can be used instead of end if

## `unless` Statement

    unless condition then
        # code
    end unless

## `for`..`from`..`to` Loop

    let res := []

    for i from 1 to 10 do
        res.push(i)
    end for

    # end do and done can be used instead of end for

    return res

## `do` ... `while` Loop

    let res := []
    let i := 0

    do
        i++
        res.push(i)
    while i < 10

## `foreach`..`in` Loop

    let res := []

    foreach v in {1,2,3} do
        res.push(v)
    end foreach

    # end do and done can be used instead of end foreach

    return res

## `while` Loop

    let i := 0
    let res := []

    while i < 10 do
        res.push(i)
        i++
    end while

    # end do and done can be used instead of end while

    return res

## Boolean operators

    if (thisIsTrue or not thisIsFalse) and thisOtherStuffIsTrue then
        return "Boolean operators in Audescript work like in Python"
    end if

## Arithmetic Operators and String Concatenation

This works like in Javascript.

## Set Operations

    let s := {4,5,6}

    let s2 := s union {1,2,3}
    # or let s2 := s U {1,2,3}

    let s3 := s2 inter {3,4,5,6,7}

    let p := s cross {1,2,3}
    # or let p := s X {1,2,3}

    let e := empty set

    if e does not contain 1 or s contains 4 then
        if 6 belongs to s2 then
            return true
        end if
    end if

    let bigset := s.powerset()

    s := s2 \ {1,2,3}
    # or s := s2 minus {1,2,3}

## Ternary

    # Mostly like OCaml

    return (
        if thisIsTrue then
            42
        else
            24
    )

    # NOTE: no end if. Parentheses are not mandatory, but this is highly recommanded.

[Back to the index](index.md)
