package br.alertarisk.controllers.request.clima;

import br.alertarisk.enums.AlertaNivel;
import br.alertarisk.enums.AlertaStatus;
import br.alertarisk.enums.CategoriaPostagem;
import br.alertarisk.models.Endereco;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record SaveAlertaRequest(
        @NotNull
        @JsonProperty("status")
        AlertaStatus status,
        @NotNull
        @JsonProperty("categoria")
        CategoriaPostagem categoria,
        @NotNull
        @JsonProperty("nivel")
        AlertaNivel nivel,
        @NotNull
        @JsonProperty("endereco")
        Endereco endereco
) { }
