Set WshShell = CreateObject("WScript.Shell")
CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Backend dizinine git
BackendPath = CurrentDirectory & "\backend"

' Node.js sunucusunu gizli olarak başlat
WshShell.Run "cmd /c cd " & BackendPath & " && node server.js", 0, False

' 3 saniye bekle
WScript.Sleep 3000

' Tarayıcıyı aç
WshShell.Run "http://localhost:3000", 1, False

' Bilgi mesajı
MsgBox "Arac Sevk Merkezi uygulamasi baslatildi. Kapatmak icin Görev Yöneticisi'nden 'node.exe' islemini sonlandirin.", vbInformation, "Arac Sevk Merkezi"