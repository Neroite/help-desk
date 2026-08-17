## Purpose

Permite anexar arquivos a um chamado ou a um comentário e garante que esses arquivos só sejam alcançáveis por quem já pode ver o chamado correspondente, sem expor endereço público permanente.

## Requirements

### Requirement: Upload de anexo vinculado ao chamado
O sistema SHALL permitir anexar arquivos na abertura do chamado e em comentários. Cada anexo SHALL guardar nome original, tamanho e o vínculo com o chamado — e, quando aplicável, com o comentário. O sistema SHALL recusar arquivos acima do limite configurado e informar o motivo.

#### Scenario: Anexo enviado no comentário
- **WHEN** um arquivo é enviado junto de um comentário
- **THEN** o anexo SHALL ser gravado vinculado àquele comentário e ao chamado, e SHALL aparecer na lista de anexos do chamado

#### Scenario: Arquivo acima do limite
- **WHEN** o arquivo enviado excede o tamanho máximo permitido
- **THEN** o envio SHALL ser recusado com mensagem indicando o limite, e nada SHALL ser gravado

#### Scenario: Falha no envio do arquivo
- **WHEN** o armazenamento do arquivo falha após o comentário ter sido aceito
- **THEN** o sistema SHALL informar a falha do anexo sem deixar registro de anexo apontando para arquivo inexistente

### Requirement: Armazenamento privado com acesso temporário
Arquivos anexados SHALL ser guardados em armazenamento privado, sem leitura anônima. O acesso SHALL ocorrer por endereço temporário de validade curta, emitido apenas para quem tem permissão de ler o chamado correspondente.

#### Scenario: Analista abre um anexo
- **WHEN** um analista clica em um anexo de um chamado
- **THEN** o sistema SHALL emitir um endereço temporário e o arquivo SHALL abrir

#### Scenario: Endereço temporário expirado
- **WHEN** um endereço emitido anteriormente é usado após a validade
- **THEN** o acesso SHALL ser negado

#### Scenario: Solicitante de outra empresa tenta acessar anexo
- **WHEN** um solicitante requisita acesso a um anexo de chamado de outra empresa
- **THEN** o sistema não SHALL emitir endereço temporário e SHALL negar o acesso

#### Scenario: Tentativa de acesso direto ao armazenamento
- **WHEN** o caminho do arquivo no armazenamento é requisitado sem endereço temporário válido
- **THEN** o armazenamento SHALL negar a leitura
