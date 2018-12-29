#!/usr/bin/python3
# -*- coding: utf-8 -*
import os

class ListFile:
    def __init__(self):
        """Initialise la liste de fichier"""
        self.tab=[]
        self.type = "none"

    def addFile(self, nameFile):
        """Ajouter le nom du fichier"""
        self.tab.append(nameFile)

    def setType(self, type):
        """Set the folder type: automaton, re, grammar"""
        self.type = type

    def toJSON(self):
        return json.dumps(arbo["all"].tab, indent=4)

# Convert the dict to a json
def toJson(arbo):
    json = "{"
    j = 1
    ln = len(arbo)
    for folder in arbo:
        json += "\"" + folder + "\"" + ":"
        json += "{"

        json += "\"tab\"" + ": ["
        i = 1 # To prevent to add a "," a the end
        l = len(arbo[folder].tab)
        for f in arbo[folder].tab:
            if i == l:
                json += "\"" + f + "\""
            else:
                json += "\"" + f + "\" ,"
            i += 1
        json += "],"
        json += "\"type\": \"" + arbo[folder].type + "\""

        if j == ln:
            json += "}"
        else:
            json += "},"
        j+=1

    json += "}"
    return json

# Take a string and return it without space, tabulation...
def partoutatis(string):
    nstr = ""
    for char in string:
        if char.isalpha() or char.isdigit():
            nstr += char

    return nstr

arbo =  {}
path = "./"

dirs = os.listdir(path)

# Visit folders and files
for d in dirs:
   if os.path.isdir(d) and d != "all":
       arbo[d] = ListFile()
       files = os.listdir(d)
       for f in files:
           if f == "type.txt":
               type = open (d + "/" + "type.txt", 'r')
               content = type.read()
               type.close()
               content = partoutatis(content)
               arbo[d].setType(content)
           else:
                arbo[d].addFile(f)

jsonArbo = toJson(arbo)

with open("listFiles.json", 'w') as f:
    f.write(jsonArbo)
