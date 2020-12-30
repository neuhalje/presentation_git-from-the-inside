;;; publish.el --- Publish reveal.js presentation from Org file
;; -*- Mode: Emacs-Lisp -*-
;; -*- coding: utf-8 -*-

;; SPDX-FileCopyrightText: 2017-2020 Jens Lechtenbörger
;; SPDX-License-Identifier: GPL-3.0-or-later

;;; License: GPL-3.0-or-later

;;; Commentary:
;; Publication of Org source files to reveal.js uses Org export
;; functionality offered by emacs-reveal, which bundles reveal.js with
;; several plugins and MELPA packages org-re-reveal,
;; org-re-reveal-ref, and oer-reveal.  Initialization code is provided
;; by emacs-reveal.
;;
;; Use this file from its parent directory with the following shell
;; command:
;; emacs --batch --load elisp/publish.el

;;; Code:
;; Setup dot.
;; The following supposes that png images are generated into directory img,
;; which needs to exist.
(make-directory "img" t)
(setq oer-reveal-publish-babel-languages '((dot . t) (emacs-lisp . t) (shell . t))
      oer-reveal-warning-delay nil
      org-publish-project-alist
      (list (list "img"
                  :base-directory "img"
                  :base-extension "png"
                  :publishing-function 'org-publish-attachment
                  :publishing-directory "./img")))

; JeNe
(setq org-confirm-babel-evaluate nil)
(org-babel-do-load-languages 'org-babel-load-languages '((shell . t)))

(setq org-plantuml-jar-path (expand-file-name "/root/plantuml.jar"))
(add-to-list 'org-src-lang-modes '("plantuml" . plantuml))
(org-babel-do-load-languages 'org-babel-load-languages '((plantuml . t)))
; ~JeNe

;; Use present environment.
(setq emacs-reveal-managed-install-p nil)

;; Load emacs-reveal.
(let ((install-dir
       (mapconcat #'file-name-as-directory
                  `(,user-emacs-directory "elpa" "emacs-reveal") "")))
  (add-to-list 'load-path install-dir)
  (condition-case nil
      ;; Either require package with above hard-coded location
      ;; (e.g., in docker) ...
      (require 'emacs-reveal)
    (error
     ;; ... or look for sub-directory "emacs-reveal" of parent project.
     (add-to-list
      'load-path
      (expand-file-name "../../emacs-reveal/" (file-name-directory load-file-name)))
     (require 'emacs-reveal))))

;; Add klipse plugin for live code execution.
(add-to-list 'oer-reveal-plugins "klipse-libs")

;; Publish Org files.
(oer-reveal-publish-all)
;;; publish.el ends here
