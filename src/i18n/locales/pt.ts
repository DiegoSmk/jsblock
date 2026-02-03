export const pt = {
    translation: {
        app: {
            layout: "Layout",
            open: "Abrir",
            folder: "Pasta",
            hide_explorer: "Esconder Explorador",
            show_explorer: "Mostrar Explorador",
            explorer: "Explorador",
            file_explorer: "Explorador de Arquivos",
            function_library: "Biblioteca de Funções",
            notes_library: "Biblioteca de Notas",
            select_file: "Selecione um arquivo para editar",
            open_folder_hint: "Abrir uma pasta ou arquivo para começar",
            window_controls: {
                minimize: "Minimizar",
                maximize: "Maximizar",
                close: "Fechar"
            },
            confirm_save: {
                title: "Salvar alterações?",
                message: "O arquivo \"{{fileName}}\" tem alterações não salvas.",
                save: "Salvar",
                cancel: "Cancelar",
                discard: "Descartar"
            },
            tooltips: {
                blueprints: "Ambiente de Blueprints",
                git: "Git (Controle de Versão)",
                settings: "Configurações",
                theme_light: "Modo Claro",
                theme_dark: "Modo Escuro"
            },
            settings: {
                title: "Configurações",
                categories: {
                    general: "Geral",
                    terminal: "Terminal",
                    appearance: "Aparência"
                },
                groups: {
                    files: "Arquivos",
                    canvas: "Canvas",
                    localization: "Localização",
                    behavior: "Comportamento",
                    interface: "Interface",
                    typography: "Tipografia"
                },
                fields: {
                    auto_save: {
                        label: "Salvamento Automático",
                        desc: "Salva as alterações nos arquivos instantaneamente ao editar."
                    },
                    auto_layout: {
                        label: "Auto-Layout",
                        desc: "Organiza os nós automaticamente ao gerar código do canvas."
                    },
                    language: {
                        label: "Idioma",
                        desc: "Define o idioma exibido na interface."
                    },
                    terminal_copy: {
                        label: "Cópia Automática",
                        desc: "Copia o texto selecionado automaticamente para a área de transferência."
                    },
                    terminal_paste: {
                        label: "Colar com Botão Direito",
                        desc: "Cola o conteúdo da área de transferência ao clicar com o botão direito no terminal."
                    },
                    theme: {
                        label: "Modo Escuro",
                        label_light: "Modo Claro",
                        desc: "Alterna entre os temas claro e escuro da aplicação."
                    },
                    font_size: {
                        label: "Tamanho da Fonte",
                        desc: "Define o tamanho base da fonte para os elementos da interface."
                    }
                },
                terminal_info: "Estas opções estão ativadas por padrão para emular o comportamento de terminais profissionais (como Putty/XShell) e contornar o uso do Ctrl+C para controle de processos.",
                json_warning: "Edite o settings.json manualmente. Alterações requerem reinício."
            },
            errors: {
                generic: "Erro: {{error}}",
                move: "Erro ao mover: {{error}}",
                delete_soon: "Funcionalidade de exclusão em breve"
            }
        },
        note: {
            title_placeholder: "Título da Nota",
            text_placeholder: "Digite suas anotações...",
            delete: "Excluir"
        },
        edge: {
            add_comment: "Inserir Comentário",
            edit_comment: "Editar Comentário",
            delete_connection: "Apagar Conexão",
            comment_prompt: "Digite o comentário para esta conexão:"
        },
        file_explorer: {
            no_folder: "Nenhuma pasta aberta",
            open_button: "Abrir Pasta",
            close_folder: "Fechar Pasta",
            already_exists: "Já existe um item com este nome no destino.",
            new_js: "Novo Arquivo JS",
            new_ts: "Novo Arquivo TS",
            new_folder: "Nova Pasta",
            delete: "Excluir",
            new_file_placeholder: "Nome do arquivo{{ext}}...",
            new_folder_placeholder: "Nome da pasta...",
            actions: {
                new_folder: "Nova Pasta",
                new_js: "Novo JS",
                new_ts: "Novo TS",
                new_md: "Nova Nota MD",
                new_block: "Novo Bloco (.block)"
            }
        },
        library: {
            search_placeholder: "Buscar funções...",
            new_block_note: "Nova Nota de Bloco",
            no_functions: "Nenhuma função encontrada",
            dive: "Mergulhar",
            categories: {
                logic: "Lógica",
                variables: "Variáveis",
                loops: "Loops",
                functions: "Funções",
                native: "Nativo"
            },
            notes: {
                title: "Notas do Arquivo",
                no_notes: "Nenhuma nota encontrada",
                search_placeholder: "Buscar informações nas notas..."
            }
        },
        recent: {
            title: "Recentes",
            favorites: "Favoritos",
            welcome: "Bem-vindo!",
            empty_message: "Seus ambientes recentes aparecerão aqui.",
            welcome_back: "Bem-vindo de volta",
            select_env: "Selecione um ambiente para continuar trabalhando",
            open_new: "Abrir Novo Ambiente",
            remove: "Remover",
            favorite: "Favoritar",
            tag: "Etiqueta",
            none: "Nenhuma",
            labels: {
                personal: "Pessoal",
                work: "Trabalho",
                fun: "Diversão",
                other: "Outro"
            },
            time: {
                now: "agora mesmo",
                minutes: "minutos atrás",
                hours: "horas atrás",
                days: "dias atrás",
                months: "meses atrás",
                years: "anos atrás"
            }
        },
        git: {
            common: {
                refresh: "Atualizar",
                delete: "Excluir",
                cancel: "Cancelar",
                unknown_author: "Autor Desconhecido",
                days: {
                    sun: "Dom",
                    mon: "Seg",
                    tue: "Ter",
                    wed: "Qua",
                    thu: "Qui",
                    fri: "Sex",
                    sat: "Sáb"
                }
            },
            status: {
                title: "Mudanças",
                untracked: "Não Rastreados",
                staged: "Prontos para Commit",
                modified: "Modificados",
                empty: "Tudo limpo, diretório de trabalho limpo",
                commit_placeholder: "Mensagem do commit...",
                commit_button: "Commitar",
                push_tooltip: "Enviar alterações para o remoto",
                pull_tooltip: "Baixar alterações do remoto",
                refresh_tooltip: "Atualizar Status",
                ignore_tooltip: "Gerenciar .gitignore",
                template_tooltip: "Modelos de mensagem",
                discard: "Descartar",
                stage: "Adicionar (Stage)",
                unstage: "Remover (Unstage)",
                open: "Abrir Arquivo",
                stage_all: "Preparar Todas",
                unstage_all: "Remover Todas",
                unstage_all_tooltip: "Retirar todos os arquivos da área de preparação.",
                discard_all: "Descartar Todas",
                amend_label: "Mesclar no Último Commit (Amend)",
                amend_tooltip: "Mescla alterações no último commit em vez de criar um novo.",
                stage_all_tooltip: "Prepara todos os arquivos modificados para commit.",
                discard_all_tooltip: "Reverte permanentemente todas as alterações não preparadas.",
                undo_commit_tooltip: "Desfazer último commit (mantém alterações).",
                undo_commit_empty_tooltip: "Sem histórico para desfazer.",
                stash_tooltip: "Guardar alterações atuais (Stash).",
                stash_empty_tooltip: "Nada para guardar.",
                pop_tooltip: "Restaurar alterações guardadas (Pop).",
                pop_empty_tooltip: "Nenhuma gaveta disponível.",
                view_stashes_tooltip: "Ver todas as alterações guardadas.",
                pop_confirm_title: "Restaurar Alteração?",
                pop_confirm_desc: "Traz as alterações de volta e remove da lista.",
                apply_confirm_desc: "Aplica as alterações mas mantém na lista.",
                drop_confirm_title: "Excluir Permanentemente?",
                drop_confirm_desc: "Esta ação não pode ser desfeita.",
                undo_confirm_title: "Desfazer Último Commit?",
                undo_confirm_desc: "Remove o commit mas mantém os arquivos como estão (Soft Reset).",
                no_changes: "Nenhuma alteração para visualizar",
                view_list: "Alternar para Lista",
                view_tree: "Alternar para Árvore",
                history_list: "Lista de Commits",
                history_refresh: "Atualizar Histórico",
                history_filter_placeholder: "Filtrar commits...",
                history_empty: "Nenhum commit encontrado",
                history_files_changed: "Arquivos Alterados",
                history_checkout_tooltip: "Voltar para este commit (Estado Detached)",
                history_branch_tooltip: "Criar nova branch a partir daqui",
                history_tag_tooltip: "Marcar este ponto na história (Tag)",
                history_loading_files: "Carregando arquivos...",
                history_no_files: "Nenhum arquivo listado",
                clean_untracked_tooltip: "Remover todos os arquivos não rastreados (Git Clean)",
                clean_untracked_label: "Limpar Não Rastreados",
                clean_confirm_title: "Limpar Arquivos Não Rastreados",
                clean_confirm_desc: "Isso apagará PERMANENTEMENTE {{count}} arquivos/pastas não rastreados. Esta ação não pode ser desfeita.",
                clean_confirm_button: "Limpar Tudo",
                action_unstage_tooltip: "Remover da área de preparação",
                action_stage_tooltip: "Preparar para commit",
                action_discard_tooltip: "Descartar alterações",
                action_ignore_tooltip: "Adicionar ao .gitignore",
                ignore_confirm_title: "Ignorar Arquivo",
                ignore_confirm_desc: "Como você deseja ignorar \"{{path}}\"?",
                ignore_confirm_this: "Ignorar este Arquivo",
                ignore_confirm_all: "Ignorar todos {{ext}}"
            },
            detail: {
                title: "Detalhes",
                author: "Autor",
                date: "Data",
                files_changed: "Arquivos Alterados",
                no_files: "Nenhuma alteração de arquivo detectada",
                checkout: "Checkout",
                new_branch: "Nova Branch",
                new_tag: "Nova Tag",
                branch_modal_title: "Criar Branch a partir deste Commit",
                tag_modal_title: "Criar Tag neste Commit",
                branch_placeholder: "Nome da nova branch",
                tag_placeholder: "Nome da Tag (ex: v1.0.0)"
            },
            graph: {
                title: "Grafo de Commits",
                author: "Autor",
                date: "Data",
                hash: "Hash",
                message: "Mensagem",
                no_commits: "Nenhum commit encontrado neste repositório."
            },
            info: {
                title: "Informações Analíticas",
                settings_tooltip: "Configurar visualização das seções",
                sections: {
                    overview: "Visão Geral",
                    stats: "Estatísticas",
                    weekly: "Atividade Semanal",
                    hourly: "Horários de Pico",
                    contributors: "Ranking de Contribuidores",
                    tags: "Tags & Versões"
                },
                tooltips: {
                    overview: "Mapa de Calor de contribuições",
                    stats: "Métricas reais do repositório",
                    weekly: "Distribuição por dia da semana",
                    hourly: "Análise de produtividade 24h",
                    contributors: "Liderança de commits por autor",
                    tags: "Gerenciamento de Tags do Repositório"
                },
                stats: {
                    branches: "Branches",
                    commits: "Commits",
                    stashes: "Stashes",
                    files: "Arquivos",
                    git_size: "Tamanho .git",
                    project_size: "Projeto",
                    tooltips: {
                        branches: "Total de ramificações no projeto",
                        commits: "Histórico total de versões",
                        stashes: "Alterações guardadas temporariamente",
                        files: "Arquivos rastreados pelo Git",
                        git_size: "Tamanho dos metadados e histórico",
                        project_size: "Tamanho total da pasta de trabalho"
                    }
                },
                heatmap: {
                    less: "Menos",
                    more: "Mais",
                    contributions: "contribuições"
                },
                tags: {
                    empty: "Nenhuma tag encontrada neste repositório.",
                    delete_confirm: "Tem certeza que deseja deletar a tag {{tag}}?",
                    delete_tooltip: "Deletar Tag"
                },
                panel_config: {
                    title: "Personalizar Painel",
                    subtitle: "Escolha quais métricas deseja ver",
                    visible: "Visível",
                    hidden: "Oculto",
                    restored: "Restaurado!",
                    reset: "Restaurar Padrões"
                }
            },
            terminal: {
                title: "Terminal Integrado",
                macros_tooltip: "Atalhos personalizados para execução rápida de comandos",
                auto_copy: "Auto-Copy",
                click_paste: "Click-Paste",
                external: "Externo",
                external_tooltip: "Abrir no Terminal do Sistema",
                prompt: {
                    title: "Confirmação Necessária",
                    message: "O processo aguarda sua resposta",
                    yes: "Sim",
                    no: "Não"
                },
                suggestion: {
                    title: "Sugestão do Git",
                    message: "Quis dizer",
                    ignore: "Ignorar",
                    fix: "Corrigir Agora"
                },
                success: {
                    title: "Git Commit",
                    message: "realizado!",
                    undo: "Desfazer"
                },
                progress: {
                    npm: "NPM Install/Build...",
                    git: "Git Operation...",
                    default: "Processando Tarefa..."
                },
                modal: {
                    title: "Configurar Atalho de Execução",
                    name_label: "Nome do Atalho",
                    name_placeholder: "Ex: Start Dev",
                    cmd_label: "Instrução SQL/Bash",
                    cmd_placeholder: "Ex: npm run dev",
                    interaction_label: "Modo de Interação",
                    auto_exec: {
                        title: "Execução Automática",
                        desc: "O comando é enviado e processado imediatamente ao clicar no atalho."
                    },
                    fill_only: {
                        title: "Apenas Preencher",
                        desc: "Insere o código no prompt, permitindo revisão antes da execução manual."
                    },
                    cancel: "Cancelar",
                    create: "Criar Atalho"
                }
            },
            modals: {
                ignore: {
                    title: "Editar: .gitignore",
                    desc: "Defina padrões de arquivos que o Git deve ignorar",
                    placeholder: "Ex: node_modules/\\n/dist/\\n*.log",
                    save: "Salvar Alterações",
                    cancel: "Cancelar",
                    success_toast: ".gitignore atualizado com sucesso!",
                    error_toast: "Erro ao salvar .gitignore"
                },
                template: {
                    title: "Templates de Commit",
                    empty_title: "Nenhum template salvo.",
                    empty_subtitle: "Crie um para agilizar seus commits!",
                    use: "Usar Template",
                    new: "Novo Template",
                    name_label: "Nome do Template (Identificador)",
                    name_placeholder: "Ex: Daily Update, Release Notes...",
                    content_label: "Conteúdo do Template",
                    add_description: "Adicionar Descrição ao Template",
                    subject_label: "Título (Assunto)",
                    subject_placeholder: "Título do template...",
                    body_label: "Corpo (Descrição)",
                    body_placeholder: "Descrição detalhada...",
                    collapse_description: "Recolher Descrição",
                    save_button: "Salvar Template"
                },
                author: {
                    title: "Identidade do Autor",
                    manage_profiles: "Gerenciar Perfis",
                    save: "Salvar Alterações",
                    new_profile: "Novo Perfil",
                    name_placeholder: "Nome Completo",
                    email_placeholder: "Email",
                    custom_tag: "Personalizado",
                    custom_tag_placeholder: "Nome da Flag (Ex: Freelance)",
                    create_profile: "Criar Perfil",
                    existing_profiles: "Perfis Existentes",
                    no_profiles: "Nenhum perfil cadastrado.",
                    scope_label: "Escopo de Configuração",
                    scope_local: "Local",
                    scope_local_desc: "Apenas este projeto",
                    scope_global: "Global",
                    scope_global_desc: "Todos os projetos",
                    active_badge: "Ativo",
                    edit_global: "Alterar Configuração Global",
                    quick_profiles: "Perfis Rápidos",
                    global_missing: "Configuração global não encontrada. Configure seu autor global para todos os projetos.",
                    name_label: "Nome",
                    email_label: "Email"

                }
            }
        }
    }
};
