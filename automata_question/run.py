#!/usr/bin/python3
# -*- coding: utf-8 -*
import os
from shutil import copyfile



class ListFile:
    def __init__(self):
        """Initialise la liste de fichier"""
        self.tab=[]
        self.type="none"

    def addFile(self,nameFile):
        """Ajouter le nom du fichier"""
        self.tab.append(nameFile)

    def setType(self,type):
        """Met le type de dossier: automate, er, grammaire"""
        self.type=type

    def toJSON(self):
        return json.dumps(arbo["all"].tab,indent=4)

#Convert the dict to a json
def toJson(arbo):
    json="{"
    j=1
    ln = len(arbo)
    for folder in arbo:
        json+="\""+folder+"\""+":"
        json+="{"

        json += "\"tab\""+": ["
        i = 1 #To prevent to add a "," a the end
        l = len(arbo[folder].tab)
        for file in arbo[folder].tab:
            if i==l:
                json += "\""+file+"\""
            else:
                json += "\""+file+"\" ,"
            i+=1
        json += "],"
        json += "\"type\": \""+ arbo[folder].type +"\""

        if j==ln:
            json+="}"
        else:
            json+="},"
        j+=1

    json+="}"
    return json

def partoutatis(str):
    nstr=""
    for char in str:
        if char.isalpha():
            nstr+=char

    return nstr

arbo =  dict()
arbo["all"] = ListFile()
path = "./"

dirs = os.listdir(path)

for dir in dirs:
   if os.path.isdir(dir) and dir!="all":
       arbo[dir]= ListFile()
       files=os.listdir(dir)
       for file in files:
           if file=="type.txt":
               type = open (dir+"/"+"type.txt",'r')
               content = type.read()
               type.close()
               content = partoutatis(content)
               arbo[dir].setType(content)
           else:
                arbo[dir].addFile(file)
                arbo["all"].addFile(file)
                copyfile(dir+"/"+file,"all"+"/"+file)  #To put all the file in the dir "all"




#jsonArbo = json.dumps(arbo["all"].tab,indent=4) #Create the JSON

jsonArbo = toJson(arbo)
print(jsonArbo)


file = open ("listAutomata.json",'w')
file.write(jsonArbo)
file.close()
