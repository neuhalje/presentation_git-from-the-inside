# SPDX-FileCopyrightText: 2020 Jens Neuhalfen
# SPDX-License-Identifier: CC0-1.0

FROM registry.gitlab.com/oer/emacs-reveal/emacs-reveal
LABEL maintainer="Jens Neuhalfen"

RUN apt-get update && apt-get install gnuplot tree -y

RUN emacs --batch --load /tmp/manage-packages.el \
    --eval="(setq gnutls-algorithm-priority \"NORMAL:-VERS-TLS1.3\")" \
    --eval="(mp-install-pkgs '(gnuplot) \"/tmp/archives\")"

RUN mkdir /emacs && cp -rp  /root/.emacs /root/.emacs.d /emacs/. && sed -i -e 's/root/emacs/g' /emacs/.emacs

RUN echo "\n;; --- JeNe\n(setq org-confirm-babel-evaluate nil)\n(org-babel-do-load-languages 'org-babel-load-languages\n '((shell . t)))" >> /emacs/.emacs

COPY  convert-to-html.sh /emacs/.

RUN cp /root/plantuml-*/plantuml.jar /emacs/.
RUN echo "\n(setq org-plantuml-jar-path (expand-file-name \"/emacs/plantuml.jar\"))\n(add-to-list 'org-src-lang-modes '(\"plantuml\" . plantuml))\n(org-babel-do-load-languages 'org-babel-load-languages '((plantuml . t) (gnuplot . t)))" >> /emacs/.emacs

COPY  elisp /emacs/elisp
COPY  publish.sh /emacs/.
COPY  oer-publish.sh /emacs/.

# Until merged: https://gitlab.com/oer/org-re-reveal/-/merge_requests/32
RUN rm -rf /emacs/.emacs.d/elpa/emacs-reveal/org-re-reveal && \
    git clone -b pr/custom-themes https://gitlab.com/neuhalje/org-re-reveal.git /emacs/.emacs.d/elpa/emacs-reveal/org-re-reveal

# make /emacs world readable and run the container via --user $(id -u):$(id -g)
RUN find /emacs -type f -executable -exec chmod 777  \{\} \; && \
    find /emacs -type f -not -executable -exec chmod 666  \{\} \; && \
    find /emacs -type d -exec chmod 777  \{\} \;

RUN useradd -rm -d /home/builder -s /bin/bash  -u 1001 builder

USER builder
WORKDIR /home/builder
RUN git config --global user.email "alice@neuhalfen.name" &&  git config --global user.name "Alice (me)"
