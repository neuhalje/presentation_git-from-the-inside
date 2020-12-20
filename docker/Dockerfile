# SPDX-FileCopyrightText: 2020 Jens Neuhalfen
# SPDX-License-Identifier: CC0-1.0

FROM registry.gitlab.com/oer/emacs-reveal/emacs-reveal
LABEL maintainer="Jens Neuhalfen"

RUN echo "\n;; --- JeNe\n(setq org-confirm-babel-evaluate nil)\n(org-babel-do-load-languages 'org-babel-load-languages\n '((shell . t)))" >> /root/.emacs

RUN git config --global user.email "alice@neuhalfen.name" &&  git config --global user.name "Alice (me)"

ADD convert-to-html.sh /root/.
RUN chmod 755 /root/convert-to-html.sh
