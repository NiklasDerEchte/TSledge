## Kern Thema:
Überarbeitung und Erweiterung der API Endpunkte für Ressourcen.
Es soll Userfreundlicher und flexibler werden.
Außerdem möchte ich Kernelemente die ich in verschiedenen Projekten nutzen könnte auch hier Isoliert bereitstellen.

### Offene Fragen:

- Wie soll die Id dargestellt werden?

```
/api/v1/users?id=xx 
```
(und?)/oder
```
/api/v1/users/42
```

### Filter
- Die Filter müssen pro Endpunkt in einer Config festgelegt werden
```
/users?role=admin&sort=createdAt,desc
/users?skip=25&limit=25
/user-profiles
```

## RETURN

- Multiple Resources
```
{
    "data": [],
    "meta": {
        "total": 0
    }
}
```

- Single Resource
```
{
    "data": {}
}
```

### TODO

- Es fehlt noch eine Dynamische Auth Validierung im FluentPatternExecutor
- Es fehlt auch noch die EOL Abfrage, das ganze soll auch möglichst Dynamisch sein
- Die Filter(Felder der Collection, also nicht nach q und den feldern filtern) Überprüfen/Überarbeiten
- Das Auth verfahren darf/muss für jede route speziell an und aus geschaltet werden


## Unsortiert
GET    /api/v1/users
GET    /api/v1/users/42
POST   /api/v1/users
PATCH  /api/v1/users/42
DELETE /api/v1/users/42
GET    /api/v1/users/42/orders?status=open
GET    /user-roles
GET    /user-roles?userId=42
GET    /user-roles?roleId=7
GET /users/42/roles
GET /roles/7/users