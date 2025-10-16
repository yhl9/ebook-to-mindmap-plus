# Guia de Configuração de Provedores de IA

## Visão Geral

Este guia ajudará você a configurar manualmente provedores de IA para usar serviços de IA personalizados na aplicação de conversão de e-books para mapas mentais.

## Localização do Arquivo de Configuração

Arquivo de configuração: `src/config/aiProviders.json`

## Estrutura de Configuração

### Estrutura Básica

```json
{
  "providers": {
    "provider_id": {
      "name": "Nome do Provedor",
      "apiUrl": "URL Base da API",
      "models": [...],
      "parameters": {...}
    }
  }
}
```

### Configuração Detalhada

#### 1. Informações Básicas do Provedor

```json
{
  "provider_id": {
    "name": "Nome do Provedor",        // Nome exibido na interface
    "apiUrl": "https://api.exemplo.com/v1",  // URL base da API
    "models": [...],               // Lista de modelos
    "parameters": {...}           // Configuração de parâmetros
  }
}
```

#### 2. Configuração de Modelos

```json
"models": [
  {
    "id": "model-id",                    // Identificador único do modelo
    "name": "Nome do Modelo",        // Nome exibido na interface
    "description": "Descrição do modelo"   // Descrição detalhada do modelo
  }
]
```

#### 3. Configuração de Parâmetros

```json
"parameters": {
  "temperature": {
    "type": "number",           // Tipo de parâmetro: number, string, boolean
    "min": 0,                   // Valor mínimo (apenas para tipo number)
    "max": 2,                   // Valor máximo (apenas para tipo number)
    "default": 0.7,             // Valor padrão
    "description": "Descrição do parâmetro"   // Descrição do parâmetro
  }
}
```

## Tipos de Parâmetros Suportados

### 1. Parâmetros Numéricos
```json
{
  "type": "number",
  "min": 0,
  "max": 2,
  "default": 0.7,
  "description": "Controla a aleatoriedade da saída"
}
```

### 2. Parâmetros de String
```json
{
  "type": "string",
  "default": "auto",
  "description": "Formato de saída"
}
```

### 3. Parâmetros Booleanos
```json
{
  "type": "boolean",
  "default": true,
  "description": "Habilitar saída em streaming"
}
```

## Parâmetros Comuns

### Parâmetros Universais

| Parâmetro | Tipo | Descrição | Intervalo |
|-----------|------|-----------|----------|
| `temperature` | number | Controla a aleatoriedade da saída, valores mais altos = mais aleatório | 0-2 |
| `maxTokens` | number | Controla o comprimento máximo do conteúdo gerado | 1-8192 |
| `topP` | number | Controla a diversidade do conteúdo gerado | 0-1 |
| `frequencyPenalty` | number | Reduz conteúdo repetitivo | -2 a 2 |
| `presencePenalty` | number | Encoraja novos tópicos | -2 a 2 |

## Passos para Adicionar Novos Provedores

### Passo 1: Determinar Informações do Provedor

1. **ID do Provedor**: Escolha um identificador único (ex., `meu-provedor`)
2. **URL da API**: Obtenha a URL base da API do provedor
3. **Autenticação**: Entenda como autenticar (API Key, Bearer Token, etc.)

### Passo 2: Obter Informações dos Modelos

1. Verifique a lista de modelos suportados pelo provedor
2. Obtenha o ID e descrição de cada modelo
3. Entenda os requisitos de parâmetros para cada modelo

### Passo 3: Escrever Configuração

```json
{
  "providers": {
    "meu-provedor": {
      "name": "Meu Provedor de IA",
      "apiUrl": "https://api.meuprovedor.com/v1",
      "models": [
        {
          "id": "modelo-1",
          "name": "Modelo 1",
          "description": "Modelo de resposta rápida"
        },
        {
          "id": "modelo-2", 
          "name": "Modelo 2",
          "description": "Modelo de alta qualidade"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "Controla a aleatoriedade da saída"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "Controla o comprimento máximo do conteúdo gerado"
        }
      }
    }
  }
}
```

### Passo 4: Atualizar Código da Aplicação

1. **Adicionar Tipo de Provedor**: Adicionar novo tipo de provedor em `src/services/aiService.ts`
2. **Implementar Classe de Serviço**: Criar classe de implementação de serviço correspondente
3. **Atualizar Classe Factory**: Registrar novo provedor em `aiServiceFactory.ts`

## Exemplos de Configuração

### Exemplo de Configuração OpenAI

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
          "description": "Modelo econômico"
        },
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "description": "Modelo mais poderoso"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "Controla a aleatoriedade da saída"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "Controla o comprimento máximo do conteúdo gerado"
        }
      }
    }
  }
}
```

### Exemplo de Configuração de Provedor Personalizado

```json
{
  "providers": {
    "ia-personalizada": {
      "name": "Serviço de IA Personalizado",
      "apiUrl": "https://api.ia-personalizada.com/v1",
      "models": [
        {
          "id": "modelo-personalizado-1",
          "name": "Modelo Personalizado 1",
          "description": "Modelo otimizado para mapas mentais"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 1,
          "default": 0.5,
          "description": "Controla a aleatoriedade da saída"
        },
        "maxTokens": {
          "type": "number",
          "min": 100,
          "max": 2000,
          "default": 1000,
          "description": "Controla o comprimento máximo do conteúdo gerado"
        },
        "estilo": {
          "type": "string",
          "default": "profissional",
          "description": "Estilo de saída"
        }
      }
    }
  }
}
```

## Notas Importantes

### 1. Validação de Configuração
- Certifique-se de que todos os campos obrigatórios estejam preenchidos
- Verifique se os tipos e intervalos de parâmetros estão corretos
- Verifique se os IDs de modelo correspondem à API do provedor

### 2. Considerações de Performance
- Defina valores padrão razoáveis para `maxTokens`
- Ajuste o intervalo de `temperature` com base nas características do modelo
- Considere os tempos de resposta de diferentes modelos

### 3. Segurança
- Não codifique chaves de API em arquivos de configuração
- Use variáveis de ambiente para informações sensíveis
- Atualize regularmente as chaves de API

## Solução de Problemas

### Problemas Comuns

1. **Configuração Não Entra em Efeito**
   - Verifique se o formato JSON está correto
   - Confirme se o caminho do arquivo está correto
   - Reinicie a aplicação

2. **Modelos Não Disponíveis**
   - Verifique se os IDs de modelo estão corretos
   - Verifique se a URL da API está acessível
   - Confirme se as chaves de API são válidas

3. **Erros de Parâmetros**
   - Verifique se os tipos de parâmetros correspondem
   - Verifique se os intervalos de parâmetros são razoáveis
   - Verifique a documentação da API para requisitos de parâmetros

### Dicas de Depuração

1. **Habilitar Modo de Depuração**: Verifique mensagens de erro detalhadas no console do navegador
2. **Verificar Solicitações de Rede**: Use ferramentas de desenvolvedor para ver o status das solicitações de API
3. **Validar Configuração**: Use um validador JSON online para verificar o formato da configuração

## Registro de Alterações

- **v1.0.0**: Versão inicial com suporte de configuração básica
- **v1.1.0**: Adicionado suporte de tipos de parâmetros
- **v1.2.0**: Suporte para parâmetros personalizados

## Suporte Técnico

Se você encontrar problemas durante a configuração, por favor:

1. Verifique a seção de solução de problemas deste documento
2. Verifique os Issues do projeto no GitHub
3. Entre em contato com suporte técnico: yhluns@163.com

---

*Última atualização:  2025.10*
