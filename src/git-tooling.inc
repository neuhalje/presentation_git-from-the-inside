* Git                                                                           :noexport:
Pass =repo= per header args, e.g.

#+begin_example
,** My subheading
:PROPERTIES:
:header-args: :var repo="/tmp/abc"
:END:
,#+CALL: init_repo()
,#+CALL: dot-graph-from-git()
#+end_example
** =git=: Call git
#+NAME: git
#+begin_src bash :exports results :results silent :var cmd="status"
git ${cmd}
#+end_src

#+NAME: shell
#+begin_src bash :exports results :results silent :var cmd="pwd"
${cmd}
#+end_src

#+begin_example
The current head is call_git(cmd="rev-parse --short HEAD") ...
#+end_example


** =init_repo=: Initialize a repository at =repo=

#+name: force-temp-repo
#+begin_src bash :results silent
if [[ ${repo} == "/tmp/"* ]];then
    rm -rf "${repo}"
else
    echo "Not in a temp directory: '${repo}'"
    exit 1
fi
#+end_src


#+name: init_repo
#+header: :var repo=(org-entry-get nil "repo" t)
#+begin_src bash :results output
(
echo "$(date +%s%N) INIT REPO ${repo}" >> /tmp/log
if [[ ${repo} == "/tmp/"* ]];then
    rm -rf "${repo}"

    mkdir -p "${repo}"
    cd "${repo}"
    git init
else
    echo "Not in a temp directory: '${repo}'"
fi) 1>/dev/null
#+end_src
** =dot-graph-from-git=: Generate a graphviz graph from a repository at =repo=
#+NAME: dot-graph-from-git
#+begin_src bash :results output
if [[ ${repo} == "/tmp/"* ]];then
    if [[ ! -d ${repo} ]];then
       echo "${repo} is not a repository!"
       exit 2
    fi
    cd "${repo}" || exit 2

    echo 'digraph git {'
    echo "// repo: ${repo}"
    echo "// cwd: ${PWD}"
    echo 'graph [bgcolor=transparent]'

    git rev-list -g --all --pretty='tformat:  "%H" [label="%h"]; "%H-msg" [label="%s" margin="0" shape="none" ]; "%H" -> "%H-msg" [K="0.0" arrowhead="none" style="dotted" dir="backward"]; {rank=same "%H" "%H-msg"}'|grep -v ^commit|sort|uniq

    echo
    git show-ref -s | while read ref; do
        git log --pretty='tformat:  %H -> { %P };' $ref | sed 's/[0-9a-f][0-9a-f]*/\"&\"/g'
    done | sort | uniq
    echo

    # branch label
    git branch -l  --format='"%(refname:lstrip=2)" [label="%(refname:lstrip=2)" shape="cds" style="filled" fillcolor="darkgoldenrod1" ]; "%(refname:lstrip=2)" -> "%(objectname)"  [arrowhead="none"];{rank=same "%(refname:lstrip=2)" "%(objectname)"};'

    git branch -l -r  --format='"%(refname:lstrip=2)" [label="%(refname:lstrip=2)" shape="cds" style="filled,dashed" fillcolor="darkgoldenrod1" ]; "%(refname:lstrip=2)" -> "%(objectname)"  [arrowhead="none"];{rank=same "%(refname:lstrip=2)" "%(objectname)"};'

    git tag -l  --format='"%(objectname)" [label="Tag: %(refname:lstrip=2)" shape="box" style="filled" ]; "%(object)" -> "%(objectname)" [arrowhead="none"];{rank=same "%(objectname)" "%(object)"};'

    # ranking
    echo "}"
else
    echo "ERROR: Will only run in /tmp but repo='${repo}'" >&1
    exit 1
fi
#+end_src

#+RESULTS: dot-graph-from-git

** =git_with_diff=: Run a =git= command and show the result as an animation
Takes a =source= block named =command_id= and a repository (=repo=) and runs the source block in the repository. Before and after running the command a snapshot of the repository is taken and exported as an animation.

The result is:
- Result ID :: used internally as a random (=uuid=).
- Target for SVG :: A =div= that will later contain the SVG.
- Animation source ::  An =animation= with a random (=uuid=) id with the prefix =result-=. Contained are the =step=s before and after the command.
- Callback :: The callback is automtically regsitered
- Command output :: The command output is rendered into a =#+begin_src= element with the =NAME= =${command_id}-result=. =:exports= is set to =none=. It can be used with ~noweb~.
*** TODO Example
#+begin_example
#+end_example

*** Parameters
- $1: command_id ::  calls ~command_id~ with variable ~repo~ set to =repo=
*** Code
=org-sbe= is a strange beast, to say the least. It only accepts parameters via macro calls. The source code is written in a =#+begin_src:= block and then manually joined. The =repo= is read via macro call, passed to the generator script and from there woven into the generated script.

The goal is: /get the =repo= passed to the script referenced by =command_id= /. Ideally we would get the value from the execution environment (as a =PROPERTY=).
1. =org-sbe= cannot use parameters from variables, so we can only use (a) macro parameters (=$1=) or (b) pass fixed string.
2. We use [[help:org-entry-get][org-entry-get]] to get the property =repo= and pass it into the generator script.
3. The generator script then inlines =repo= into the =org-sbe= call.

Some caveats:
- The macro gets called with the context of its call (={{{...}}}=) but has no access to variables (=repo=)
- All =org-sbe= called code gets called in the context of /where the code is defined/, *not* where the =org-sbe= call takes place.

#+MACRO: git_with_diff (eval (let ((script (format "#+begin_src emacs-lisp :results result raw :exports results\n(message \"Executing generator script!\")\n(org-sbe generate_git_with_diff (command_id $\"%s\") (repo $\"%s\"))\n#+end_src" $1 (org-entry-get nil "repo" t)))) (progn (message "Macro expansion generated script:\n%s" script) script)))

# inline the result of a call to a command =command_id=
#+MACRO: git_with_diff_result (eval (format "#+begin_src  emacs-lisp :exports results :results value :wrap src bash\n(cadr (assoc \"%s\" git-command-result))\n#+end_src\n" $1))

#+NAME: generate_git_with_diff
#+header: :var command_id="command_id not set" :var repo="REPO not set"
#+begin_src emacs-lisp :exports none :wrap src emacs-lisp
(message "In generator script: Generating template. repo=%s, command_id=%s" repo command_id)

(defun replace-in-string (what with in)
  (replace-regexp-in-string (regexp-quote what) with in nil 'literal))

(if (not (string-match "^/tmp/[a-zA-Z0-9_/\\-]+$" repo))
    (error "ERROR: String '%s' is not a valid repository path starting with /tmp/" repo) nil)

 (let*
   ((template (cadr (org-babel-lob--src-info "git-diff-template")))
    (template (replace-in-string "%(command_id)" command_id template ))
    (template (replace-in-string "%(repo)" repo template))
                ) (format "#+begin_src emacs-lisp  :exports results :results value raw\n%s\n#+end_src" template))
#+end_src

#+NAME: git-diff-template
#+begin_src emacs-lisp :results result raw :exports none :eval never
(eval
(progn
  (message "Running git command in repo '%(repo)': %(command_id)")
  (let*
      (
       (command_id (string-trim "%(command_id)"))
       (result_div_id "%(command_id)-result")
       (animation_id "%(command_id)-animation")
       (scale (string-trim "%(scale)"))
       (repo-set (not (equal "%(repo)" "")))
       (dummy (progn (if (not repo-set) (error "No repo set when calling %s" command_id) (message "Using repo %s" "%(repo)"))))
       (pre (if repo-set
             (org-sbe dot-graph-from-git (repo $"%(repo)"))
             (org-sbe dot-graph-from-git)
             ))
       (command_output (if repo-set
             (org-sbe %(command_id) (repo $"%(repo)"))
             (org-sbe %(command_id))
             ))
       (post (if repo-set
             (org-sbe dot-graph-from-git (repo $"%(repo)"))
             (org-sbe dot-graph-from-git)
             ))
       )
    (message "pushing result")
    (push `(,command_id ,command_output) git-command-result)
    (message "generating output result")
    (concat
     "#+begin_export html\n"
     "<callback  style='display:none' targetElementSelector='#"  result_div_id "' arg='" animation_id "'></callback>\n"
     "<animation style='display:none' id='" animation_id "'>\n"
     "<step>\n"
     pre
     "\n"
     "</step>\n"
     "<step>\n"
     post
     "\n"
     "</step>\n"
     "</animation>\n"
     "#+end_export\n"
     "\n"
     "#+NAME: " (format "%s-output" command_id) "\n"
     "#+begin_src bash :exports none :eval never :noweb yes\n"
     command_output
     "\n"
     "#+end_src\n"
     )

  )))
#+end_src

# Used to store the result of a call
#+begin_src emacs-lisp :exports  results :results silent
(make-local-variable 'git-command-result)
(setq git-command-result (list ))
#+end_src
** =mk_example_repo=: Create an example repository
#+NAME: mk_example_repo
#+begin_src bash :results output :var repo="2" :exports both :noweb yes :cache no
if [[ ${repo} == "/tmp/"* ]];then
    rm -rf "${repo}"

    mkdir -p "${repo}/local"
    mkdir -p "${repo}/origin"
    cd "${repo}/local"
    git init
    touch README
    git add README

    git commit -m 'initial'
    git commit --allow-empty -m 'first'
    git checkout -b develop
    git commit --allow-empty -m 'second'
    git checkout -b feature-1
    git commit --allow-empty -m 'feature 1'
    git commit --allow-empty -m 'feature 1 again'
    git checkout develop
    git commit --allow-empty -m 'third'
    git checkout -b feature-2
    git commit --allow-empty -m 'feature 2'
    git commit --allow-empty -m 'feature 2 again'
    git checkout develop
    git merge --no-ff feature-2
    git checkout master
    git commit --allow-empty -m 'commit pre merge on master'
    git merge --no-ff develop
    git tag -a 1.0 -m '1.0!'


    cd "${repo}/origin"
    git init --bare .

    cd "${repo}/local"
    git remote add origin ../origin

    git checkout master
    git push -u origin master
    git fetch origin
else
    echo "ERROR: Will only run in /tmp but repo='${repo}'" >&1
fi
#+end_src

* Reveal                                                                        :noexport:
** =inline-js=: Inline a =begin_src= block as JavaScript
#+name: inline-js
#+begin_src elisp :exports none :results html :var blk=""
(concat
 "<script type=\"text/javascript\">\n"
 (cadr (org-babel-lob--src-info blk))
 "\n"
 "</script>")
#+end_src
** =inline-graphviz=: Inline a =begin_src= block as =graphviz=
#+name: inline-graphviz
#+begin_src elisp :exports none :results html :var blk=""
; inline a named block as <graphviz>..</graphviz> element.
(concat
"<graphviz>\n"
 (cadr (org-babel-lob--src-info blk))
"</graphviz>\n"
)
#+end_src
** =inline-source=: Inline a =begin_src= block verbatim
#+name: inline-source
#+begin_src elisp :exports none :var blk=""
 (cadr (org-babel-lob--src-info blk))
#+end_src
