# SPDX-FileCopyrightText: 2020 Jens Neuhalfen
# SPDX-License-Identifier: CC0-1.0

FROM registry.gitlab.com/oer/emacs-reveal/emacs-reveal
LABEL maintainer="Jens Neuhalfen"

RUN echo "\n;; --- JeNe\n(setq org-confirm-babel-evaluate nil)\n(org-babel-do-load-languages 'org-babel-load-languages\n '((shell . t)))" >> /root/.emacs

RUN git config --global user.email "alice@neuhalfen.name" &&  git config --global user.name "Alice (me)"

ADD convert-to-html.sh /root/.
RUN chmod 755 /root/convert-to-html.sh

RUN cp /root/plantuml-*/plantuml.jar /root/.
RUN echo "\n(setq org-plantuml-jar-path (expand-file-name \"/root/plantuml.jar\"))\n(add-to-list 'org-src-lang-modes '(\"plantuml\" . plantuml))\n(org-babel-do-load-languages 'org-babel-load-languages '((plantuml . t)))" >> /root/.emacs

ADD elisp /root/elisp
ADD publish.sh /root/.
ADD oer-publish.sh /root/.
