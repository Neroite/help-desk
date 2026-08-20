## MODIFIED Requirements

### Requirement: Upload de anexo vinculado ao chamado
O sistema SHALL permitir anexar arquivos na abertura do chamado e em comentários. Cada
anexo SHALL guardar nome original, tamanho e o vínculo com o chamado — e, quando
aplicável, com o comentário. O sistema SHALL recusar arquivos acima do limite
configurado e informar o motivo. Um anexo marcado como **inline** (imagem colada ou
arrastada dentro do editor de comentário, já embutida no corpo do comentário) NÃO SHALL
aparecer na lista de "Anexos" do chamado — evita duplicar a mesma imagem em dois lugares.

#### Scenario: Anexo enviado no comentário
- **WHEN** um arquivo é enviado junto de um comentário através do controle de anexar
- **THEN** o anexo SHALL ser gravado vinculado àquele comentário e ao chamado, e SHALL
  aparecer na lista de anexos do chamado

#### Scenario: Imagem embutida no editor não duplica na lista de anexos
- **WHEN** uma imagem é colada ou arrastada dentro do editor de comentário e inserida no
  corpo do texto
- **THEN** o anexo correspondente SHALL ser gravado como inline e NÃO SHALL aparecer na
  lista de "Anexos" do chamado

#### Scenario: Arquivo acima do limite
- **WHEN** o arquivo enviado excede o tamanho máximo permitido
- **THEN** o envio SHALL ser recusado com mensagem indicando o limite, e nada SHALL ser
  gravado

#### Scenario: Falha no envio do arquivo
- **WHEN** o armazenamento do arquivo falha após o comentário ter sido aceito
- **THEN** o sistema SHALL informar a falha do anexo sem deixar registro de anexo
  apontando para arquivo inexistente

## ADDED Requirements

### Requirement: Imagem embutida no comentário é servida por rota estável
Uma imagem inline referenciada no corpo de um comentário SHALL ser acessada por um
endereço estável (não uma signed URL fixa, que expiraria), que reemite acesso temporário
a cada requisição e aplica a mesma regra de permissão do chamado dono do anexo. A rota
SHALL recusar qualquer tipo de arquivo que não seja imagem raster comum.

#### Scenario: Imagem embutida continua acessível depois da URL assinada expirar
- **WHEN** um comentário com imagem embutida é reaberto minutos depois de criado, após o
  prazo de validade de uma signed URL comum
- **THEN** a imagem SHALL continuar sendo exibida normalmente

#### Scenario: Rota recusa tipo de arquivo que não é imagem
- **WHEN** a rota de imagem embutida é requisitada para um anexo cujo tipo armazenado não
  é `image/png`, `image/jpeg`, `image/gif` ou `image/webp`
- **THEN** o sistema SHALL recusar a resposta com código 415, sem servir o conteúdo

#### Scenario: Usuário sem permissão de ver o chamado não alcança a imagem
- **WHEN** um usuário sem permissão de ver o chamado dono do anexo requisita a rota de
  imagem embutida
- **THEN** o sistema SHALL responder como se o anexo não existisse (404), sem indicar que
  o recurso existe mas é proibido
