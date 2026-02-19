## Ideen
- Die FluentAPIOptions auch "select" felder für das jeweilige Model gesetzt bekommen können. Sonst kann man dieses "select" nur individuell über den QueryBuilder setzen
- Eine Klasse von der man erben kann und dann sein "Model" definieren, ein constructor soll automatisch die public attributes im Editor anzeigen zum übergeben
- SocketIO handling

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
- Die Api Auth Routen müssen irgendwie dynamisch gemacht werden, sodass man gleich auch seine eigenen user daten speichern kann
- Die AuthUser Payload in der middleware muss durch eine dynamische variable erweitert werden, sodass gleich durch den identifier ein user geladen werden kann
- In CraftERP gab es ein Problem mit dem Schama "ref", das muss hier mal getestet und ausgebaut werden


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