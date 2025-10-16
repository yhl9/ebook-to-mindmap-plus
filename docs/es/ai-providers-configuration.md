# Guía de Configuración de Proveedores de IA

## Resumen

Esta guía te ayudará a configurar manualmente los proveedores de IA para usar servicios de IA personalizados en la aplicación de conversión de libros electrónicos a mapas mentales.

## Ubicación del Archivo de Configuración

Archivo de configuración: `src/config/aiProviders.json`

## Estructura de Configuración

### Estructura Básica

```json
{
  "providers": {
    "provider_id": {
      "name": "Nombre del Proveedor",
      "apiUrl": "URL Base de la API",
      "models": [...],
      "parameters": {...}
    }
  }
}
```

### Configuración Detallada

#### 1. Información Básica del Proveedor

```json
{
  "provider_id": {
    "name": "Nombre del Proveedor",        // Nombre mostrado en la interfaz
    "apiUrl": "https://api.ejemplo.com/v1",  // URL base de la API
    "models": [...],               // Lista de modelos
    "parameters": {...}           // Configuración de parámetros
  }
}
```

#### 2. Configuración de Modelos

```json
"models": [
  {
    "id": "model-id",                    // Identificador único del modelo
    "name": "Nombre del Modelo",        // Nombre mostrado en la interfaz
    "description": "Descripción del modelo"   // Descripción detallada del modelo
  }
]
```

#### 3. Configuración de Parámetros

```json
"parameters": {
  "temperature": {
    "type": "number",           // Tipo de parámetro: number, string, boolean
    "min": 0,                   // Valor mínimo (solo para tipo number)
    "max": 2,                   // Valor máximo (solo para tipo number)
    "default": 0.7,             // Valor por defecto
    "description": "Descripción del parámetro"   // Descripción del parámetro
  }
}
```

## Tipos de Parámetros Soportados

### 1. Parámetros Numéricos
```json
{
  "type": "number",
  "min": 0,
  "max": 2,
  "default": 0.7,
  "description": "Controla la aleatoriedad de la salida"
}
```

### 2. Parámetros de Cadena
```json
{
  "type": "string",
  "default": "auto",
  "description": "Formato de salida"
}
```

### 3. Parámetros Booleanos
```json
{
  "type": "boolean",
  "default": true,
  "description": "Habilitar salida en streaming"
}
```

## Parámetros Comunes

### Parámetros Universales

| Parámetro | Tipo | Descripción | Rango |
|-----------|------|-------------|-------|
| `temperature` | number | Controla la aleatoriedad de la salida, valores más altos = más aleatorio | 0-2 |
| `maxTokens` | number | Controla la longitud máxima del contenido generado | 1-8192 |
| `topP` | number | Controla la diversidad del contenido generado | 0-1 |
| `frequencyPenalty` | number | Reduce el contenido repetitivo | -2 a 2 |
| `presencePenalty` | number | Fomenta nuevos temas | -2 a 2 |

## Pasos para Agregar Nuevos Proveedores

### Paso 1: Determinar la Información del Proveedor

1. **ID del Proveedor**: Elige un identificador único (ej., `mi-proveedor`)
2. **URL de la API**: Obtén la URL base de la API del proveedor
3. **Autenticación**: Entiende cómo autenticar (API Key, Bearer Token, etc.)

### Paso 2: Obtener Información de Modelos

1. Revisa la lista de modelos soportados por el proveedor
2. Obtén el ID y descripción de cada modelo
3. Entiende los requisitos de parámetros para cada modelo

### Paso 3: Escribir la Configuración

```json
{
  "providers": {
    "mi-proveedor": {
      "name": "Mi Proveedor de IA",
      "apiUrl": "https://api.miproveedor.com/v1",
      "models": [
        {
          "id": "modelo-1",
          "name": "Modelo 1",
          "description": "Modelo de respuesta rápida"
        },
        {
          "id": "modelo-2", 
          "name": "Modelo 2",
          "description": "Modelo de alta calidad"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "Controla la aleatoriedad de la salida"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "Controla la longitud máxima del contenido generado"
        }
      }
    }
  }
}
```

### Paso 4: Actualizar el Código de la Aplicación

1. **Agregar Tipo de Proveedor**: Agregar nuevo tipo de proveedor en `src/services/aiService.ts`
2. **Implementar Clase de Servicio**: Crear clase de implementación de servicio correspondiente
3. **Actualizar Clase Factory**: Registrar nuevo proveedor en `aiServiceFactory.ts`

## Ejemplos de Configuración

### Ejemplo de Configuración de OpenAI

```json
{
  "providers": {
    "openai": {
      "name": "OpenAI",
      "apiUrl": "https://api.openai.com/v1",
      "models": [
        {
          "id": "gpt-3.5-turbo",
          "name": "GPT-3.5 Turbo",
          "description": "Modelo económico"
        },
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "description": "Modelo más potente"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "Controla la aleatoriedad de la salida"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "Controla la longitud máxima del contenido generado"
        }
      }
    }
  }
}
```

### Ejemplo de Configuración de Proveedor Personalizado

```json
{
  "providers": {
    "ia-personalizada": {
      "name": "Servicio de IA Personalizado",
      "apiUrl": "https://api.ia-personalizada.com/v1",
      "models": [
        {
          "id": "modelo-personalizado-1",
          "name": "Modelo Personalizado 1",
          "description": "Modelo optimizado para mapas mentales"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 1,
          "default": 0.5,
          "description": "Controla la aleatoriedad de la salida"
        },
        "maxTokens": {
          "type": "number",
          "min": 100,
          "max": 2000,
          "default": 1000,
          "description": "Controla la longitud máxima del contenido generado"
        },
        "estilo": {
          "type": "string",
          "default": "profesional",
          "description": "Estilo de salida"
        }
      }
    }
  }
}
```

## Notas Importantes

### 1. Validación de Configuración
- Asegúrate de que todos los campos requeridos estén completos
- Verifica que los tipos y rangos de parámetros sean correctos
- Comprueba que los IDs de modelo coincidan con la API del proveedor

### 2. Consideraciones de Rendimiento
- Establece valores por defecto razonables para `maxTokens`
- Ajusta el rango de `temperature` según las características del modelo
- Considera los tiempos de respuesta de diferentes modelos

### 3. Seguridad
- No codifiques claves de API en archivos de configuración
- Usa variables de entorno para información sensible
- Actualiza regularmente las claves de API

## Solución de Problemas

### Problemas Comunes

1. **La Configuración No Tiene Efecto**
   - Verifica si el formato JSON es correcto
   - Confirma que la ruta del archivo sea correcta
   - Reinicia la aplicación

2. **Modelos No Disponibles**
   - Verifica que los IDs de modelo sean correctos
   - Comprueba si la URL de la API es accesible
   - Confirma que las claves de API sean válidas

3. **Errores de Parámetros**
   - Verifica que los tipos de parámetros coincidan
   - Confirma que los rangos de parámetros sean razonables
   - Revisa la documentación de la API para los requisitos de parámetros

### Consejos de Depuración

1. **Habilitar Modo de Depuración**: Revisa mensajes de error detallados en la consola del navegador
2. **Verificar Solicitudes de Red**: Usa las herramientas de desarrollador para ver el estado de las solicitudes de API
3. **Validar Configuración**: Usa un validador JSON en línea para verificar el formato de configuración

## Registro de Cambios

- **v1.0.0**: Versión inicial con soporte de configuración básica
- **v1.1.0**: Agregado soporte de tipos de parámetros
- **v1.2.0**: Soporte para parámetros personalizados

## Soporte Técnico

Si encuentras problemas durante la configuración, por favor:

1. Revisa la sección de solución de problemas de este documento
2. Consulta los Issues del proyecto en GitHub
3. Contacta soporte técnico: yhluns@163.com

---

*Última actualización:  2025.10*
