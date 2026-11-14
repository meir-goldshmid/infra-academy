window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
// Infra ops 2: virtualization in depth, enterprise & distributed storage (Ceph), Ansible hands-on.
(function () {
const t = (en, he) => ({ en, he });

// ---------- shared code snippets (same in both languages) ----------
const PRE_KVM_CHECK = `<pre># 1. Does the CPU expose hardware virtualization? (vmx = Intel VT-x, svm = AMD-V)
$ grep -Ec '(vmx|svm)' /proc/cpuinfo
32
$ lsmod | grep kvm
kvm_intel             409600  4
kvm                  1347584  1 kvm_intel
$ sudo virt-host-validate qemu
  QEMU: Checking for hardware virtualization                 : PASS
  QEMU: Checking if device /dev/kvm exists                   : PASS
  QEMU: Checking for cgroup 'cpu' controller support         : PASS
  QEMU: Checking for secure guest support                    : WARN (Unknown if this platform has Secure Guest support)</pre>`;

const PRE_VIRSH = `<pre># create a VM from an Ubuntu cloud image, virtio disk + NIC, serial console
$ sudo virt-install --name web01 --memory 4096 --vcpus 2 \\
    --disk path=/var/lib/libvirt/images/web01.qcow2,size=20,bus=virtio,backing_store=/var/lib/libvirt/images/noble.img \\
    --network network=default,model=virtio \\
    --os-variant ubuntu24.04 --import --graphics none \\
    --cloud-init user-data=./user-data.yaml

$ virsh list --all
 Id   Name    State
------------------------
 3    web01   running
 -    db01    shut off

$ virsh dominfo web01
Id:             3
Name:           web01
UUID:           6f1c2b0e-3a8d-4d52-9f0a-2b7c1e5d9a41
OS Type:        hvm
State:          running
CPU(s):         2
CPU time:       41.7s
Max memory:     4194304 KiB
Used memory:    4194304 KiB
Persistent:     yes
Autostart:      disable
Managed save:   no
Security model: apparmor</pre>`;

const PRE_NUMA = `<pre>$ lscpu | grep -i numa
NUMA node(s):        2
NUMA node0 CPU(s):   0-15,32-47
NUMA node1 CPU(s):   16-31,48-63

# libvirt domain XML (virsh edit db01): 8 vCPUs pinned to node0, memory strictly from node0
&lt;vcpu placement='static'&gt;8&lt;/vcpu&gt;
&lt;cputune&gt;
  &lt;vcpupin vcpu='0' cpuset='2'/&gt;
  &lt;vcpupin vcpu='1' cpuset='3'/&gt;
  ...
&lt;/cputune&gt;
&lt;numatune&gt;
  &lt;memory mode='strict' nodeset='0'/&gt;
&lt;/numatune&gt;
&lt;memoryBacking&gt;&lt;hugepages/&gt;&lt;/memoryBacking&gt;</pre>`;

const PRE_MIGRATE = `<pre># live-migrate with shared storage (Ceph RBD / NFS / SAN)
$ virsh migrate --live --persistent --undefinesource --verbose \\
    web01 qemu+ssh://kvm02.lab/system
Migration: [100 %]

# no shared storage: copy the disk too (much slower, full disk over the wire)
$ virsh migrate --live --copy-storage-all web01 qemu+ssh://kvm02.lab/system

# watch a running migration: dirty rate vs bandwidth decides if it converges
$ virsh domjobinfo web01
Data processed:   6.120 GiB
Data remaining:   212.000 MiB
Memory bandwidth: 1.100 GiB/s
Dirty rate:       38000 pages/s</pre>`;

const PRE_KUBEVIRT = `<pre>apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: legacy-erp
spec:
  runStrategy: Always
  template:
    spec:
      domain:
        cpu: { cores: 4 }
        memory: { guest: 16Gi }
        devices:
          disks:
            - name: root
              disk: { bus: virtio }
      volumes:
        - name: root
          dataVolume: { name: legacy-erp-root }   # imported by CDI from a qcow2 / VMDK

$ kubectl get vmi
NAME         AGE   PHASE     IP            NODENAME   READY
legacy-erp   3d    Running   10.244.3.17   worker-3   True
$ virtctl console legacy-erp</pre>`;

const PRE_ISCSI = `<pre># on the initiator (client): discover targets on the array's portal (TCP 3260)
$ sudo iscsiadm -m discovery -t sendtargets -p 10.20.0.50:3260
10.20.0.50:3260,1 iqn.2005-10.org.freenas.ctl:db-lun
10.20.1.50:3260,1 iqn.2005-10.org.freenas.ctl:db-lun

# log in (CHAP creds go in /etc/iscsi/iscsid.conf or per node)
$ sudo iscsiadm -m node -T iqn.2005-10.org.freenas.ctl:db-lun --login
$ sudo iscsiadm -m session
tcp: [1] 10.20.0.50:3260,1 iqn.2005-10.org.freenas.ctl:db-lun (non-flash)
tcp: [2] 10.20.1.50:3260,1 iqn.2005-10.org.freenas.ctl:db-lun (non-flash)

# the same LUN now shows up twice (two paths) -&gt; let multipath merge them
$ sudo multipath -ll
mpatha (36589cfc000000a1b2c3d4e5f60718293) dm-2 TrueNAS,iSCSI Disk
size=500G features='0' hwhandler='1 alua' wp=rw
|-+- policy='service-time 0' prio=50 status=active
| \`- 7:0:0:0 sdb 8:16 active ready running
\`-+- policy='service-time 0' prio=10 status=enabled
  \`- 8:0:0:0 sdc 8:32 active ready running
# mount /dev/mapper/mpatha, never /dev/sdb directly</pre>`;

const PRE_CEPH_S = `<pre>$ ceph -s
  cluster:
    id:     a7f64266-0894-4f1e-a635-d0aeaca0e993
    health: HEALTH_WARN
            1 osds down
            Degraded data redundancy: 51234/3145728 objects degraded (1.629%), 41 pgs degraded

  services:
    mon: 3 daemons, quorum mon1,mon2,mon3 (age 3w)
    mgr: mon1(active, since 3w), standbys: mon2
    osd: 24 osds: 23 up (since 4m), 24 in (since 6M)
    rgw: 2 daemons active (2 hosts, 1 zones)

  data:
    pools:   6 pools, 1057 pgs
    objects: 1.05M objects, 3.9 TiB
    usage:   11.8 TiB used, 31.9 TiB / 43.7 TiB avail
    pgs:     51234/3145728 objects degraded (1.629%)
             1016 active+clean
             41   active+undersized+degraded

  io:
    client:   210 MiB/s rd, 85 MiB/s wr, 3.2k op/s rd, 1.9k op/s wr

$ ceph osd tree
ID  CLASS  WEIGHT    TYPE NAME       STATUS  REWEIGHT  PRI-AFF
-1         43.66406  root default
-3         14.55469      host node1
 0    ssd   1.81940          osd.0       up   1.00000  1.00000
 1    ssd   1.81940          osd.1       up   1.00000  1.00000
...
-7         14.55469      host node3
16    ssd   1.81940          osd.16    down   1.00000  1.00000
...</pre>`;

const PRE_ROOK = `<pre>apiVersion: ceph.rook.io/v1
kind: CephCluster
metadata: { name: rook-ceph, namespace: rook-ceph }
spec:
  cephVersion: { image: quay.io/ceph/ceph:v19.2.2 }
  dataDirHostPath: /var/lib/rook
  mon: { count: 3, allowMultiplePerNode: false }
  storage:
    useAllNodes: false
    nodes:
      - name: storage-1
        devices: [ { name: nvme1n1 }, { name: nvme2n1 } ]
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: ceph-block }
provisioner: rook-ceph.rbd.csi.ceph.com
parameters: { clusterID: rook-ceph, pool: replicapool, csi.storage.k8s.io/fstype: ext4 }
reclaimPolicy: Delete
allowVolumeExpansion: true

$ kubectl -n rook-ceph exec deploy/rook-ceph-tools -- ceph status</pre>`;

const PRE_INV = `<pre># inventory/prod.ini (static, INI)
[web]
web01 ansible_host=10.0.1.11
web02 ansible_host=10.0.1.12

[app]
app01 ansible_host=10.0.2.21
app02 ansible_host=10.0.2.22

[prod:children]
web
app

[prod:vars]
ansible_user=ubuntu

# inventory/aws_ec2.yml (dynamic; filename MUST end in aws_ec2.yml)
plugin: amazon.aws.aws_ec2
regions: [eu-west-1]
filters:
  tag:env: prod
  instance-state-name: running
keyed_groups:
  - key: tags.role        # tag role=web  -&gt; group role_web
    prefix: role
hostnames: [private-ip-address]

$ ansible-inventory -i inventory/aws_ec2.yml --graph
@all:
  |--@aws_ec2:
  |  |--10.0.1.11
  |--@role_web:
  |  |--10.0.1.11</pre>`;

const PRE_ADHOC = `<pre>$ ansible web -i inventory/prod.ini -m ansible.builtin.ping
web01 | SUCCESS =&gt; {
    "changed": false,
    "ping": "pong"
}
web02 | UNREACHABLE! =&gt; {
    "changed": false,
    "msg": "Failed to connect to the host via ssh: ssh: connect to host 10.0.1.12 port 22: Connection timed out",
    "unreachable": true
}

$ ansible prod -i inventory/prod.ini -m ansible.builtin.shell -a "uptime" -f 20
$ ansible web -i inventory/prod.ini -b -m ansible.builtin.apt -a "name=htop state=present"
$ ansible web -i inventory/prod.ini -m ansible.builtin.setup -a "filter=ansible_distribution*"</pre>`;

const PRE_PLAYBOOK = `<pre># site.yml
---
- name: Configure nginx web tier
  hosts: web
  become: true
  serial: "25%"              # roll through 25% of hosts at a time
  max_fail_percentage: 10    # abort the rollout if &gt;10% of a batch fails
  vars:
    nginx_worker_connections: 4096
    app_port: 8080
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true
        cache_valid_time: 3600

    - name: Render nginx.conf from template
      ansible.builtin.template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: "0644"
        validate: nginx -t -c %s   # a broken config is never written
      notify: Reload nginx

    - name: Ensure nginx is running and enabled at boot
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Reload nginx         # runs once, at the end of the play, only if notified
      ansible.builtin.service:
        name: nginx
        state: reloaded</pre>
<pre># templates/nginx.conf.j2
# {{ ansible_managed }}
user www-data;
worker_processes auto;
events { worker_connections {{ nginx_worker_connections }}; }
http {
  upstream app {
{% for host in groups['app'] %}
    server {{ hostvars[host]['ansible_host'] }}:{{ app_port }};
{% endfor %}
  }
  server {
    listen 80;
    location / { proxy_pass http://app; }
  }
}</pre>
<pre>$ ansible-playbook -i inventory/prod.ini site.yml          # first run
PLAY RECAP ****************************************************************
web01 : ok=5  changed=3  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0
web02 : ok=5  changed=3  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0

$ ansible-playbook -i inventory/prod.ini site.yml          # second run: idempotent
web01 : ok=4  changed=0  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0
web02 : ok=4  changed=0  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0</pre>`;

const PRE_IDEMP = `<pre># BAD: always "changed", re-runs every time, can't run in --check
- name: Add repo line
  ansible.builtin.shell: echo "deb http://repo.local stable main" &gt;&gt; /etc/apt/sources.list

# GOOD: module knows the desired state -&gt; "ok" on the second run
- name: Add repo line
  ansible.builtin.lineinfile:
    path: /etc/apt/sources.list
    line: "deb http://repo.local stable main"

# When you must use command: tell Ansible how to judge it
- name: Initialise the database once
  ansible.builtin.command: /opt/app/bin/init-db
  args:
    creates: /var/lib/app/.initialised   # skipped if the file exists

- name: Check cluster health
  ansible.builtin.command: /opt/app/bin/health
  register: health
  changed_when: false                    # read-only command, never "changed"</pre>`;

const PRE_VAULT = `<pre>$ ansible-vault create group_vars/prod/vault.yml          # opens $EDITOR, saves AES256-encrypted
$ head -1 group_vars/prod/vault.yml
$ANSIBLE_VAULT;1.1;AES256
$ ansible-vault encrypt_string 'S3cr3t!' --name db_password
db_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          6231386536623463...
$ ansible-playbook site.yml --vault-password-file ~/.vault_pass    # or --ask-vault-pass, or vault IDs

# dry run: what WOULD change, with a unified diff of files/templates
$ ansible-playbook -i inventory/prod.ini site.yml --check --diff --limit web01
--- before: /etc/nginx/nginx.conf
+++ after: /home/me/.ansible/tmp/.../nginx.conf.j2
@@ -3 +3 @@
-events { worker_connections 1024; }
+events { worker_connections 4096; }

$ ansible-playbook site.yml --tags nginx --limit 'web:!web02'
$ ansible-playbook site.yml --list-hosts --list-tasks</pre>`;

const PRE_ROLE = `<pre>roles/nginx/
├── defaults/main.yml     # lowest-precedence defaults (override me)
├── vars/main.yml         # role constants (high precedence)
├── tasks/main.yml
├── handlers/main.yml
├── templates/nginx.conf.j2
├── files/
├── meta/main.yml         # dependencies, supported platforms
└── molecule/default/     # tests

# requirements.yml
collections:
  - name: amazon.aws
    version: "&gt;=9.0.0"
  - name: community.general
roles:
  - name: geerlingguy.docker
    version: 7.4.1

$ ansible-galaxy init roles/nginx
$ ansible-galaxy install -r requirements.yml       # roles
$ ansible-galaxy collection install -r requirements.yml
$ cd roles/nginx &amp;&amp; molecule test       # create -&gt; converge -&gt; idempotence -&gt; verify -&gt; destroy</pre>`;

// ======================= LESSON 1: virtualization-deep =======================
INFRA.lessons.push({
  id: "virtualization-deep",
  track: "foundations",
  order: 61,
  icon: "🧱",
  level: 3,
  minutes: 16,
  title: t("Virtualization in Depth: KVM, vSphere, Proxmox & microVMs", "וירטואליזציה לעומק: KVM, ‏vSphere, ‏Proxmox ו-microVMs"),
  tldr: t(
    "Modern virtualization is hardware-assisted: VT-x/AMD-V run guest code natively and EPT translates guest memory in silicon, KVM turns Linux into the hypervisor, QEMU emulates devices (fast only with virtio), and libvirt manages it all. Everything else — overcommit, NUMA pinning, live migration, vMotion, Firecracker, KubeVirt, AWS Nitro — is built on that stack or its VMware/Hyper-V equivalent.",
    "וירטואליזציה מודרנית נשענת על החומרה: VT-x/AMD-V מריצים את קוד ה-guest ישירות על המעבד, EPT מתרגם את הזיכרון של ה-guest בסיליקון, KVM הופך את Linux ל-hypervisor, ‏QEMU מדמה את ההתקנים (ומהיר רק עם virtio), ו-libvirt מנהל את כל זה. כל השאר — overcommit, ‏NUMA pinning, ‏live migration, ‏vMotion, ‏Firecracker, ‏KubeVirt, ‏AWS Nitro — בנוי על ה-stack הזה או על המקבילה שלו ב-VMware/Hyper-V."
  ),
  analogy: t(
    "Think of a hotel. The CPU's VT-x is a building designed with hotel rooms built in: guests (VMs) live normally in their rooms and only call the front desk (the hypervisor) for privileged things like changing the locks. EPT is the room-number map built into the elevator, so guests don't need a bellboy to translate every floor. virtio is room service with a menu designed for the hotel, instead of guests pretending to phone an outside restaurant (emulated hardware). Overcommit is selling 130 rooms for 100 beds because not everyone checks in — great until the conference weekend. Live migration is moving a sleeping guest to another hotel without waking him.",
    "תחשוב על מלון. VT-x במעבד זה בניין שתוכנן מראש עם חדרי מלון: האורחים (VMs) חיים בחדרים כרגיל ופונים לקבלה (ה-hypervisor) רק לדברים מיוחסים כמו החלפת מנעול. EPT זו מפת החדרים שמובנית במעלית, כך שאורח לא צריך שליח שיתרגם לו כל קומה. virtio זה room service עם תפריט שנבנה בשביל המלון, במקום שהאורח יעמיד פנים שהוא מתקשר למסעדה בחוץ (חומרה מודמית). Overcommit זה למכור 130 חדרים על 100 מיטות כי לא כולם מגיעים — עובד מצוין עד סוף השבוע של הכנס. Live migration זה להעביר אורח ישן למלון אחר בלי להעיר אותו."
  ),
  sections: [
    {
      h: t("Hardware virtualization: VT-x, AMD-V, EPT and why it got fast", "וירטואליזציה בחומרה: VT-x, ‏AMD-V, ‏EPT ולמה זה נהיה מהיר"),
      body: t(
        `<p>The <code>vms</code> lesson covered <em>what</em> a hypervisor is. This one is about <em>how</em> it works in production. Before 2005-2006, x86 couldn't be virtualized cleanly: some privileged instructions failed silently instead of trapping, so VMware used <strong>binary translation</strong> (rewriting guest kernel code on the fly) and Xen used <strong>paravirtualization</strong> (a modified guest kernel). Then CPUs added hardware support:</p>
<table><tr><th>Feature</th><th>Intel</th><th>AMD</th><th>What it solves</th></tr>
<tr><td>CPU virtualization</td><td>VT-x (VMX root/non-root, VMCS)</td><td>AMD-V / SVM (VMCB)</td><td>Guest kernel runs natively in "non-root" mode; sensitive instructions cause a <strong>VM exit</strong> to the hypervisor</td></tr>
<tr><td>Second-level address translation</td><td>EPT</td><td>NPT / RVI</td><td>Hardware walks guest-virtual → guest-physical → host-physical. Removes "shadow page tables", which cost 10-50% on memory-heavy workloads</td></tr>
<tr><td>IO virtualization</td><td>VT-d</td><td>AMD-Vi</td><td>IOMMU: safe PCI passthrough (GPUs, NVMe) and SR-IOV NICs straight into a VM</td></tr></table>
<p>The cost of virtualization today is mostly <strong>VM exits</strong> (each one is hundreds of ns to a few µs) and IO. That is why paravirtual drivers matter: an emulated Intel e1000 NIC causes a VM exit per register access, while <strong>virtio-net</strong> batches packets through shared-memory ring buffers (virtqueues) and kicks the host once per batch.</p>
${PRE_KVM_CHECK}
<p><strong>Type 1 vs Type 2</strong>, revisited honestly: ESXi, Hyper-V and Xen are clearly Type 1. KVM is a Linux kernel module, so Linux itself becomes the Type 1 hypervisor (every VM is a regular <code>qemu-kvm</code> process you can see in <code>top</code>). VirtualBox and VMware Workstation are Type 2: an app on a desktop OS. On Windows with Hyper-V enabled (WSL2, Docker Desktop), even Windows itself runs as a privileged VM ("root partition") on top of Hyper-V.</p>`,
        `<p>השיעור <code>vms</code> כיסה <em>מה</em> זה hypervisor. השיעור הזה עוסק ב<em>איך</em> זה עובד בפרודקשן. לפני 2005-2006 אי אפשר היה לעשות וירטואליזציה נקייה ל-x86: חלק מהפקודות המיוחסות נכשלו בשקט במקום לעשות trap, אז VMware השתמשה ב-<strong>binary translation</strong> (שכתוב קוד ה-kernel של ה-guest תוך כדי ריצה) ו-Xen השתמש ב-<strong>paravirtualization</strong> (kernel של guest ששונה במיוחד). ואז המעבדים הוסיפו תמיכה בחומרה:</p>
<table><tr><th>יכולת</th><th>Intel</th><th>AMD</th><th>מה זה פותר</th></tr>
<tr><td>וירטואליזציה של CPU</td><td>VT-x ‏(VMX root/non-root, ‏VMCS)</td><td>AMD-V / SVM ‏(VMCB)</td><td>ה-kernel של ה-guest רץ ישירות במצב non-root; פקודות רגישות גורמות ל-<strong>VM exit</strong> אל ה-hypervisor</td></tr>
<tr><td>תרגום כתובות דו-שלבי</td><td>EPT</td><td>NPT / RVI</td><td>החומרה מתרגמת guest-virtual ← guest-physical ← host-physical. זה העלים את ה-shadow page tables שעלו 10-50% ב-workloads כבדי זיכרון</td></tr>
<tr><td>וירטואליזציה של IO</td><td>VT-d</td><td>AMD-Vi</td><td>IOMMU: ‏PCI passthrough בטוח (GPUs, ‏NVMe) וכרטיסי רשת SR-IOV ישירות לתוך VM</td></tr></table>
<p>המחיר של וירטואליזציה היום הוא בעיקר <strong>VM exits</strong> (כל אחד עולה מאות ננו-שניות עד כמה מיקרו-שניות) ו-IO. בגלל זה דרייברים paravirtual חשובים: כרטיס רשת e1000 מודמה גורם ל-VM exit על כל גישה לרגיסטר, בעוד <strong>virtio-net</strong> מקבץ פקטות דרך ring buffers בזיכרון משותף (virtqueues) ומעיר את ה-host פעם אחת לכל batch.</p>
${PRE_KVM_CHECK}
<p><strong>Type 1 מול Type 2</strong>, בכנות: ESXi, ‏Hyper-V ו-Xen הם בבירור Type 1. ‏KVM הוא מודול של ה-kernel של Linux, כך ש-Linux עצמו הופך ל-hypervisor מסוג 1 (כל VM היא תהליך <code>qemu-kvm</code> רגיל שאתה רואה ב-<code>top</code>). VirtualBox ו-VMware Workstation הם Type 2: אפליקציה על מערכת הפעלה של desktop. ב-Windows עם Hyper-V פעיל (WSL2, ‏Docker Desktop) אפילו Windows עצמו רץ כ-VM מיוחס ("root partition") מעל Hyper-V.</p>`
      )
    },
    {
      h: t("The Linux stack: KVM + QEMU + libvirt + virtio", "ה-stack של Linux: ‏KVM + QEMU + libvirt + virtio"),
      body: t(
        `<table><tr><th>Layer</th><th>Job</th><th>You touch it via</th></tr>
<tr><td><strong>KVM</strong> (kernel, since Linux 2.6.20, 2007)</td><td>Runs vCPUs using VT-x/AMD-V, handles memory via EPT, exposes <code>/dev/kvm</code></td><td>Rarely directly</td></tr>
<tr><td><strong>QEMU</strong> (user space, one process per VM)</td><td>Emulates the machine: BIOS/UEFI (OVMF), disks, NICs, USB; implements virtio backends; does live migration</td><td><code>qemu-system-x86_64</code>, <code>qemu-img</code></td></tr>
<tr><td><strong>libvirt</strong> (<code>libvirtd</code>/<code>virtqemud</code>)</td><td>Stable API + XML definitions of domains, networks, storage pools; used by virsh, virt-manager, OpenStack Nova, oVirt, KubeVirt</td><td><code>virsh</code>, <code>virt-install</code>, virt-manager</td></tr>
<tr><td><strong>virtio</strong></td><td>Paravirtual devices: virtio-blk / virtio-scsi (disk), virtio-net, virtio-balloon, virtio-rng, virtiofs</td><td><code>bus=virtio</code>, <code>model=virtio</code></td></tr></table>
${PRE_VIRSH}
<p>Linux guests ship virtio drivers in the kernel. <strong>Windows guests don't</strong>: you attach the <code>virtio-win</code> ISO during install, or the installer can't see a virtio disk. Disk format: <strong>qcow2</strong> gives thin provisioning, backing files (golden image + small per-VM overlay, as above) and internal snapshots; <strong>raw</strong> on LVM or Ceph RBD is a bit faster and simpler.</p>
<blockquote>💡 Real world: switching a database VM from an emulated IDE/e1000 setup to virtio-scsi + virtio-net (multi-queue) routinely takes it from ~20k to 100k+ IOPS on the same NVMe backend and cuts CPU spent in VM exits dramatically. If a VM "feels slow" on KVM, check <code>lspci</code> inside the guest for emulated devices first.</blockquote>`,
        `<table><tr><th>שכבה</th><th>תפקיד</th><th>איך נוגעים בה</th></tr>
<tr><td><strong>KVM</strong> (ב-kernel, מאז Linux 2.6.20, ‏2007)</td><td>מריץ vCPUs בעזרת VT-x/AMD-V, מנהל זיכרון דרך EPT, חושף את <code>/dev/kvm</code></td><td>כמעט אף פעם ישירות</td></tr>
<tr><td><strong>QEMU</strong> (user space, תהליך אחד לכל VM)</td><td>מדמה את המכונה: BIOS/UEFI ‏(OVMF), דיסקים, כרטיסי רשת, USB; מממש את ה-backends של virtio; מבצע live migration</td><td><code>qemu-system-x86_64</code>, <code>qemu-img</code></td></tr>
<tr><td><strong>libvirt</strong> ‏(<code>libvirtd</code>/<code>virtqemud</code>)</td><td>API יציב והגדרות XML של domains, רשתות ו-storage pools; משמש את virsh, ‏virt-manager, ‏OpenStack Nova, ‏oVirt, ‏KubeVirt</td><td><code>virsh</code>, <code>virt-install</code>, ‏virt-manager</td></tr>
<tr><td><strong>virtio</strong></td><td>התקנים paravirtual: ‏virtio-blk / virtio-scsi (דיסק), virtio-net, ‏virtio-balloon, ‏virtio-rng, ‏virtiofs</td><td><code>bus=virtio</code>, <code>model=virtio</code></td></tr></table>
${PRE_VIRSH}
<p>ל-guests של Linux יש דרייברים של virtio בתוך ה-kernel. <strong>ל-Windows אין</strong>: מצרפים את ה-ISO של <code>virtio-win</code> בזמן ההתקנה, אחרת ה-installer לא רואה את דיסק ה-virtio. פורמט דיסק: <strong>qcow2</strong> נותן thin provisioning, ‏backing files (golden image ועליו overlay קטן לכל VM, כמו בדוגמה) ו-snapshots פנימיים; <strong>raw</strong> על LVM או Ceph RBD קצת יותר מהיר ופשוט.</p>
<blockquote>💡 מהשטח: מעבר של VM של מסד נתונים מ-IDE/e1000 מודמים ל-virtio-scsi + virtio-net ‏(multi-queue) לוקח אותו באופן שגרתי מבערך 20k ל-100k+ IOPS על אותו NVMe, וחותך דרמטית את ה-CPU שהולך על VM exits. אם VM "מרגישה איטית" על KVM, קודם כל תבדוק <code>lspci</code> בתוך ה-guest ותחפש התקנים מודמים.</blockquote>`
      )
    },
    {
      h: t("Overcommit, ballooning, NUMA pinning", "Overcommit, ‏ballooning ו-NUMA pinning"),
      body: t(
        `<p><strong>CPU overcommit</strong>: vCPUs are just threads, so a 64-thread host can run 256 vCPUs (4:1). Typical ratios: 3:1-5:1 for general web/VDI, 1:1 (or pinned) for databases, latency-sensitive and telco workloads. The symptom of too much is <strong>steal time</strong> — the guest wanted CPU but the hypervisor ran someone else: <code>%st</code> in <code>top</code>/<code>vmstat</code> inside the guest; sustained &gt;5-10% hurts latency. On VMware the host-side metric is <strong>CPU Ready</strong> (rule of thumb: &gt;5% per vCPU is a problem).</p>
<p><strong>Memory overcommit</strong> is riskier because RAM isn't time-sliced. Techniques, from cheap to painful:</p>
<table><tr><th>Technique</th><th>How</th><th>Catch</th></tr>
<tr><td>Page sharing (KSM on KVM, TPS on ESXi)</td><td>Merge identical pages across VMs</td><td>CPU cost; cross-VM sharing is a side-channel risk, so ESXi disabled inter-VM TPS by default in 2014</td></tr>
<tr><td><strong>Ballooning</strong> (virtio-balloon, VMware Tools vmmemctl)</td><td>A driver inside the guest "inflates" by allocating memory and hands those pages back to the host</td><td>The guest now has less RAM — it may swap or hit its own OOM killer</td></tr>
<tr><td>Compression (ESXi)</td><td>Compress pages before swapping</td><td>CPU, still slower than RAM</td></tr>
<tr><td>Host swapping</td><td>Hypervisor swaps guest RAM to disk</td><td>The guest doesn't know; latency collapses. This is the "everything is slow, nothing in the guest explains it" incident</td></tr></table>
<p><strong>NUMA</strong>: a 2-socket server has 2 memory domains; remote memory costs roughly 1.3-2x the latency of local. A 16-vCPU VM spread across sockets with memory on the wrong node can lose 20-30% throughput. Size big VMs to fit inside one NUMA node, pin vCPUs and memory, and use hugepages for databases:</p>
${PRE_NUMA}
<blockquote>⚠️ Production tip: overcommit CPU, be careful with memory. A common sane policy: CPU up to 4:1, memory 1:1 (or at most ~1.2:1 with ballooning as a safety valve), and never overcommit hosts that run databases or Kubernetes nodes — the kubelet thinks it has RAM that isn't really there.</blockquote>`,
        `<p><strong>CPU overcommit</strong>: vCPUs הם בסך הכל threads, כך ש-host עם 64 threads יכול להריץ 256 vCPUs ‏(4:1). יחסים מקובלים: 3:1-5:1 ל-web כללי ו-VDI, ‏1:1 (או pinning) למסדי נתונים, workloads רגישים ל-latency ו-telco. הסימן שהגזמת הוא <strong>steal time</strong> — ה-guest רצה CPU אבל ה-hypervisor הריץ מישהו אחר: <code>%st</code> ב-<code>top</code>/<code>vmstat</code> בתוך ה-guest; ערך קבוע מעל 5-10% פוגע ב-latency. ב-VMware המדד בצד ה-host הוא <strong>CPU Ready</strong> (כלל אצבע: מעל 5% לכל vCPU זו בעיה).</p>
<p><strong>Memory overcommit</strong> מסוכן יותר, כי RAM לא מתחלק בזמן. הטכניקות, מהזולה לכואבת:</p>
<table><tr><th>טכניקה</th><th>איך</th><th>המלכוד</th></tr>
<tr><td>Page sharing ‏(KSM ב-KVM, ‏TPS ב-ESXi)</td><td>מאחד דפים זהים בין VMs</td><td>עולה CPU; שיתוף בין VMs הוא סיכון side-channel, ולכן ESXi כיבה כברירת מחדל TPS בין VMs ב-2014</td></tr>
<tr><td><strong>Ballooning</strong> ‏(virtio-balloon, ‏vmmemctl של VMware Tools)</td><td>דרייבר בתוך ה-guest "מתנפח": מקצה זיכרון ומחזיר את הדפים ל-host</td><td>ל-guest יש עכשיו פחות RAM — הוא עלול לעשות swap או להפעיל את ה-OOM killer שלו</td></tr>
<tr><td>Compression ‏(ESXi)</td><td>דוחס דפים לפני swap</td><td>עולה CPU, ועדיין איטי מ-RAM</td></tr>
<tr><td>Swap ב-host</td><td>ה-hypervisor מוריד RAM של ה-guest לדיסק</td><td>ה-guest לא יודע על זה; ה-latency קורס. זה האירוע של "הכל איטי ושום דבר בתוך ה-guest לא מסביר את זה"</td></tr></table>
<p><strong>NUMA</strong>: לשרת עם 2 sockets יש 2 תחומי זיכרון; גישה לזיכרון מרוחק עולה בערך פי 1.3-2 ב-latency לעומת מקומי. VM עם 16 vCPUs שמפוזרת בין sockets, עם זיכרון על ה-node הלא נכון, יכולה לאבד 20-30% throughput. תתכנן VMs גדולות כך שייכנסו ל-NUMA node אחד, תעשה pinning ל-vCPUs ולזיכרון, ותשתמש ב-hugepages למסדי נתונים:</p>
${PRE_NUMA}
<blockquote>⚠️ טיפ לפרודקשן: CPU מותר לעשות overcommit, עם זיכרון תיזהר. מדיניות שפויה ונפוצה: CPU עד 4:1, זיכרון 1:1 (לכל היותר בערך 1.2:1 עם ballooning כשסתום ביטחון), ואף פעם לא לעשות overcommit על hosts שמריצים מסדי נתונים או nodes של Kubernetes — ה-kubelet חושב שיש לו RAM שלא באמת קיים.</blockquote>`
      )
    },
    {
      h: t("Live migration, snapshots vs backups", "Live migration, ‏snapshots מול גיבויים"),
      body: t(
        `<p><strong>Live migration</strong> (KVM live migration, VMware vMotion, Hyper-V Live Migration) moves a running VM between hosts with no reboot. The default algorithm is <strong>pre-copy</strong>:</p>
<ol><li>Copy all guest RAM to the destination while the VM keeps running.</li>
<li>The guest keeps writing, so pages get <strong>dirty</strong>; re-send the dirty pages. Repeat — each round should be smaller.</li>
<li>When the remainder fits the allowed downtime (QEMU default <code>downtime-limit</code> 300 ms), pause the VM, copy the last pages + CPU/device state, resume on the destination, send a gratuitous ARP/RARP so switches learn the new port.</li></ol>
<p>The trap: if the guest dirties memory faster than the link can send it (a 64 GB Redis doing 1 GB/s of writes over a 10 Gb/s link ≈ 1.1 GB/s), pre-copy <strong>never converges</strong>. Fixes: a faster/dedicated migration network (25-100 Gb/s), <strong>auto-converge</strong> (throttle the guest's vCPUs), or <strong>post-copy</strong> (switch to the destination immediately and fetch missing pages on demand — fast cut-over, but if the network dies mid-way the VM is lost). Disks need shared storage (SAN, NFS, Ceph RBD, vSAN), or a storage migration (<code>--copy-storage-all</code>, Storage vMotion), which is much slower.</p>
${PRE_MIGRATE}
<p><strong>Snapshots are not backups.</strong></p>
<table><tr><th></th><th>Snapshot</th><th>Backup</th></tr>
<tr><td>Where</td><td>Same datastore, a delta file/overlay on top of the base disk</td><td>Different system, ideally different site/account (3-2-1)</td></tr>
<tr><td>Survives losing the datastore?</td><td>No</td><td>Yes</td></tr>
<tr><td>Cost over time</td><td>Delta grows with every write; long chains slow IO; deleting (consolidating) a huge one causes an IO storm and a stun</td><td>Storage + backup window</td></tr>
<tr><td>Use for</td><td>"Undo" before a risky upgrade, hours to a couple of days</td><td>Recovery from loss, ransomware, corruption</td></tr></table>
<p>Backup tools (Veeam, Proxmox Backup Server, Commvault, Velero for KubeVirt) usually <em>take</em> a snapshot briefly to get a consistent point-in-time, copy it out using changed-block tracking (CBT on VMware, dirty bitmaps on QEMU), then delete it.</p>
<blockquote>⚠️ Production tip: VMware's own guidance is to not keep a snapshot longer than about 72 hours and not run long chains. The classic outage: a backup job fails to delete its snapshot, the delta silently grows for weeks until the datastore hits 100% and <strong>every VM on it pauses</strong>. Alert on snapshot age.</blockquote>`,
        `<p><strong>Live migration</strong> (KVM live migration, ‏VMware vMotion, ‏Hyper-V Live Migration) מעביר VM רצה בין hosts בלי reboot. האלגוריתם הדיפולטי הוא <strong>pre-copy</strong>:</p>
<ol><li>מעתיקים את כל ה-RAM של ה-guest ליעד בזמן שה-VM ממשיכה לרוץ.</li>
<li>ה-guest ממשיך לכתוב, אז דפים הופכים ל-<strong>dirty</strong>; שולחים שוב את הדפים המלוכלכים. חוזרים על זה — כל סבב אמור להיות קטן יותר.</li>
<li>כשהשארית נכנסת ב-downtime המותר (ב-QEMU ברירת המחדל של <code>downtime-limit</code> היא 300 ms), עוצרים את ה-VM, מעתיקים את הדפים האחרונים ואת מצב ה-CPU וההתקנים, ממשיכים ביעד, ושולחים gratuitous ARP/RARP כדי שה-switches ילמדו את הפורט החדש.</li></ol>
<p>המלכודת: אם ה-guest מלכלך זיכרון מהר יותר ממה שהלינק מסוגל לשלוח (Redis של 64 GB שכותב 1 GB/s על לינק של 10 Gb/s, שזה בערך 1.1 GB/s), ה-pre-copy <strong>לעולם לא מתכנס</strong>. פתרונות: רשת migration מהירה וייעודית (25-100 Gb/s), <strong>auto-converge</strong> (מאטים את ה-vCPUs של ה-guest), או <strong>post-copy</strong> (עוברים ליעד מיד ומושכים דפים חסרים לפי דרישה — cut-over מהיר, אבל אם הרשת נופלת באמצע, ה-VM אבודה). הדיסקים צריכים storage משותף (SAN, ‏NFS, ‏Ceph RBD, ‏vSAN) או storage migration ‏(<code>--copy-storage-all</code>, ‏Storage vMotion), שזה הרבה יותר איטי.</p>
${PRE_MIGRATE}
<p><strong>Snapshots הם לא גיבויים.</strong></p>
<table><tr><th></th><th>Snapshot</th><th>גיבוי</th></tr>
<tr><td>איפה</td><td>על אותו datastore, קובץ delta או overlay מעל דיסק הבסיס</td><td>מערכת אחרת, רצוי אתר או חשבון אחר (3-2-1)</td></tr>
<tr><td>שורד אובדן של ה-datastore?</td><td>לא</td><td>כן</td></tr>
<tr><td>עלות לאורך זמן</td><td>ה-delta גדל עם כל כתיבה; שרשראות ארוכות מאטות IO; מחיקה (consolidation) של snapshot ענק גורמת לסערת IO ול-stun</td><td>אחסון וחלון גיבוי</td></tr>
<tr><td>משמש ל</td><td>"Undo" לפני שדרוג מסוכן, לשעות עד יומיים</td><td>שחזור מאובדן, ransomware, השחתת נתונים</td></tr></table>
<p>כלי גיבוי (Veeam, ‏Proxmox Backup Server, ‏Commvault, ‏Velero ל-KubeVirt) בדרך כלל <em>לוקחים</em> snapshot לרגע כדי לקבל נקודת זמן עקבית, מעתיקים אותו החוצה בעזרת changed-block tracking ‏(CBT ב-VMware, ‏dirty bitmaps ב-QEMU), ואז מוחקים אותו.</p>
<blockquote>⚠️ טיפ לפרודקשן: ההנחיה של VMware עצמה היא לא להחזיק snapshot יותר מבערך 72 שעות ולא להריץ שרשראות ארוכות. ה-outage הקלאסי: job של גיבוי לא מצליח למחוק את ה-snapshot שלו, ה-delta גדל בשקט במשך שבועות עד שה-datastore מגיע ל-100% ו-<strong>כל ה-VMs עליו נעצרות</strong>. תגדיר alert על גיל של snapshots.</blockquote>`
      )
    },
    {
      h: t("Platforms: vSphere vs Proxmox vs Hyper-V vs Nutanix — and the Broadcom effect", "פלטפורמות: vSphere מול Proxmox מול Hyper-V מול Nutanix — ואפקט Broadcom"),
      body: t(
        `<p><strong>VMware vSphere</strong> = <strong>ESXi</strong> (the hypervisor on each host) + <strong>vCenter</strong> (management server for clusters). Cluster features: <strong>vMotion</strong> (live migration), Storage vMotion, <strong>DRS</strong> (Distributed Resource Scheduler: places and rebalances VMs across hosts by load, with affinity/anti-affinity rules), <strong>HA</strong> (if a host dies, restarts its VMs on surviving hosts — a restart, so minutes of downtime; host isolation detected via network heartbeats + datastore heartbeats), FT (lock-step shadow VM, zero downtime, limited vCPUs), vSAN (HCI storage), NSX (networking).</p>
<table><tr><th></th><th>VMware vSphere</th><th>Proxmox VE</th><th>Microsoft Hyper-V</th><th>Nutanix AHV</th></tr>
<tr><td>Hypervisor</td><td>ESXi (proprietary)</td><td>KVM + LXC on Debian</td><td>Hyper-V (Windows Server / Azure Local)</td><td>AHV (KVM-based)</td></tr>
<tr><td>Management</td><td>vCenter</td><td>Built-in web UI, any node, corosync cluster</td><td>Failover Cluster Manager, SCVMM, Windows Admin Center</td><td>Prism</td></tr>
<tr><td>Live migration / auto-balance</td><td>vMotion / DRS</td><td>Yes / basic (HA manager; resource scheduling still maturing)</td><td>Live Migration / SCVMM dynamic optimization</td><td>Yes / ADS</td></tr>
<tr><td>Storage</td><td>VMFS on SAN, NFS, vSAN</td><td>ZFS, LVM, Ceph built in, NFS/iSCSI</td><td>CSV on SAN, Storage Spaces Direct</td><td>Built-in distributed storage (HCI)</td></tr>
<tr><td>Licensing</td><td>Per-core subscription (bundles)</td><td>Free (AGPL); paid support subscription per socket</td><td>Windows Server Datacenter licensing</td><td>Subscription, sold with HCI</td></tr></table>
<p><strong>The post-Broadcom shift (stated carefully):</strong> Broadcom closed its acquisition of VMware in November 2023. Since then it ended sales of perpetual licenses and support renewals for them, moved to <strong>subscription-only, per-core</strong> licensing (minimum 16 cores per CPU), collapsed most of the catalog into a few bundles (VMware Cloud Foundation, vSphere Foundation), and reshuffled the partner program. The free ESXi hypervisor was discontinued in early 2024 (a limited free edition was later reintroduced). Many customers publicly reported renewal increases of several times their previous cost, though the impact varies widely by contract. The result: a large wave of organizations evaluating or migrating to <strong>Proxmox VE, Hyper-V, Nutanix AHV, OpenShift Virtualization/KubeVirt</strong> or the public cloud; large enterprises with deep vSphere dependencies (NSX, vSAN, SRM, tooling) often renegotiate and stay while planning a multi-year exit. Check current terms before quoting numbers — they keep changing.</p>
<blockquote>💡 Real world: in a VMware-to-Proxmox migration, the hard parts are rarely the hypervisor. They're converting VMDKs (<code>qemu-img convert -f vmdk -O qcow2</code> or Proxmox's import wizard), swapping VMware Tools for qemu-guest-agent, injecting virtio drivers into Windows <em>before</em> the move, re-creating NSX firewall rules, and replacing backup and monitoring integrations.</blockquote>`,
        `<p><strong>VMware vSphere</strong> = <strong>ESXi</strong> (ה-hypervisor על כל host) + <strong>vCenter</strong> (שרת ניהול ל-clusters). יכולות ה-cluster: <strong>vMotion</strong> ‏(live migration), ‏Storage vMotion, <strong>DRS</strong> ‏(Distributed Resource Scheduler: ממקם ומאזן VMs בין hosts לפי עומס, עם חוקי affinity/anti-affinity), <strong>HA</strong> (אם host מת, מפעיל מחדש את ה-VMs שלו על hosts ששרדו — זה restart, כלומר כמה דקות downtime; בידוד של host מזוהה דרך heartbeats ברשת ו-heartbeats על ה-datastore), ‏FT ‏(VM צל שרצה ב-lock-step, אפס downtime, מוגבל ב-vCPUs), ‏vSAN ‏(אחסון HCI), ‏NSX (רשת).</p>
<table><tr><th></th><th>VMware vSphere</th><th>Proxmox VE</th><th>Microsoft Hyper-V</th><th>Nutanix AHV</th></tr>
<tr><td>Hypervisor</td><td>ESXi (קנייני)</td><td>KVM + LXC על Debian</td><td>Hyper-V ‏(Windows Server / Azure Local)</td><td>AHV (מבוסס KVM)</td></tr>
<tr><td>ניהול</td><td>vCenter</td><td>Web UI מובנה מכל node, ‏cluster על corosync</td><td>Failover Cluster Manager, ‏SCVMM, ‏Windows Admin Center</td><td>Prism</td></tr>
<tr><td>Live migration / איזון אוטומטי</td><td>vMotion / DRS</td><td>כן / בסיסי (HA manager; ה-resource scheduling עדיין מתבגר)</td><td>Live Migration / ‏dynamic optimization של SCVMM</td><td>כן / ADS</td></tr>
<tr><td>אחסון</td><td>VMFS על SAN, ‏NFS, ‏vSAN</td><td>ZFS, ‏LVM, ‏Ceph מובנה, NFS/iSCSI</td><td>CSV על SAN, ‏Storage Spaces Direct</td><td>אחסון מבוזר מובנה (HCI)</td></tr>
<tr><td>רישוי</td><td>מנוי לפי core (חבילות)</td><td>חינם (AGPL); מנוי תמיכה בתשלום לפי socket</td><td>רישוי Windows Server Datacenter</td><td>מנוי, נמכר עם HCI</td></tr></table>
<p><strong>השינוי שאחרי Broadcom (בזהירות):</strong> Broadcom השלימה את רכישת VMware בנובמבר 2023. מאז היא הפסיקה למכור רישיונות perpetual ולחדש להם תמיכה, עברה לרישוי <strong>מנוי בלבד, לפי core</strong> (מינימום 16 cores לכל CPU), כיווצה את רוב הקטלוג לכמה חבילות (VMware Cloud Foundation, ‏vSphere Foundation), וטלטלה את תוכנית השותפים. ה-ESXi החינמי הופסק בתחילת 2024 (מאוחר יותר חזרה גרסה חינמית מוגבלת). הרבה לקוחות דיווחו בפומבי על חידושים שעלו פי כמה מהמחיר הקודם, אבל ההשפעה משתנה מאוד בין חוזים. התוצאה: גל גדול של ארגונים שבודקים או עוברים ל-<strong>Proxmox VE, ‏Hyper-V, ‏Nutanix AHV, ‏OpenShift Virtualization/KubeVirt</strong> או לענן הציבורי; ארגונים גדולים עם תלות עמוקה ב-vSphere ‏(NSX, ‏vSAN, ‏SRM, כלים) לרוב מתמקחים ונשארים, ובמקביל מתכננים יציאה של כמה שנים. תבדוק את התנאים העדכניים לפני שאתה מצטט מספרים — הם ממשיכים להשתנות.</p>
<blockquote>💡 מהשטח: במעבר מ-VMware ל-Proxmox, החלקים הקשים הם כמעט אף פעם לא ה-hypervisor. הם המרת VMDKs ‏(<code>qemu-img convert -f vmdk -O qcow2</code> או ה-import wizard של Proxmox), החלפת VMware Tools ב-qemu-guest-agent, הזרקת דרייברים של virtio ל-Windows <em>לפני</em> המעבר, בנייה מחדש של חוקי ה-firewall של NSX, והחלפת האינטגרציות של גיבוי ו-monitoring.</blockquote>`
      )
    },
    {
      h: t("Nested virt, microVMs, KubeVirt and how the cloud does it (Nitro)", "Nested virt, ‏microVMs, ‏KubeVirt ואיך הענן עושה את זה (Nitro)"),
      body: t(
        `<p><strong>Nested virtualization</strong> = running a hypervisor inside a VM (labs, CI that builds VM images, Android emulators, running Firecracker inside a cloud VM). On KVM: <code>cat /sys/module/kvm_intel/parameters/nested</code> → <code>Y</code>, and the L1 guest needs <code>host-passthrough</code> CPU mode. Expect a real performance hit for exit-heavy workloads. Cloud support varies: GCP and Azure (many v3+ sizes) support it; on AWS the traditional answer was <code>.metal</code> instances — check current docs per instance family.</p>
<p><strong>microVMs</strong>: <strong>Firecracker</strong> (AWS, Rust) is a minimal KVM VMM — no BIOS, no PCI, just virtio-net, virtio-block, a serial console and a few more devices. Boots in ~125 ms with &lt;5 MiB memory overhead per microVM; it runs AWS Lambda and Fargate. Cloud Hypervisor and Kata Containers use the same idea to give each container/pod its own kernel (see <code>container-runtimes-oci</code>). The trade: VM-grade isolation at near-container speed, but no live migration, limited devices.</p>
<p><strong>KubeVirt</strong> runs VMs as Kubernetes objects: a <code>VirtualMachine</code> CRD, each VM inside a <code>virt-launcher</code> pod that runs libvirt + QEMU/KVM, disks as PVCs (imported by CDI), networking via the pod network or Multus. It's the engine of OpenShift Virtualization and a common landing zone for VMware exits — one platform for containers and the VMs you can't containerize yet.</p>
${PRE_KUBEVIRT}
<p><strong>How cloud instances work</strong>: <strong>AWS Nitro</strong> (since 2017, C5) moved networking (ENA), EBS (exposed as NVMe), instance storage, monitoring and security into dedicated Nitro cards and a security chip, leaving a thin KVM-based <strong>Nitro Hypervisor</strong> that does little more than CPU and memory. Result: nearly all host resources go to customers, near-bare-metal performance, and <code>.metal</code> instances that are the same hardware with no hypervisor at all. Older AWS generations ran on Xen. <strong>GCP</strong> uses KVM with its own hardened VMM; <strong>Azure</strong> uses a Hyper-V-derived hypervisor plus FPGA/DPU offload (Azure Boost).</p>
<blockquote>💡 Real world: when your EC2 disk shows up as <code>/dev/nvme1n1</code> instead of <code>/dev/xvdf</code>, that's Nitro — EBS is presented as an NVMe device by the Nitro card. Install the NVMe driver in custom AMIs, and use <code>ebsnvme-id</code> or the device symlinks to map volumes reliably.</blockquote>`,
        `<p><strong>Nested virtualization</strong> = להריץ hypervisor בתוך VM (מעבדות, CI שבונה images של VMs, אמולטורים של Android, הרצת Firecracker בתוך VM בענן). ב-KVM: <code>cat /sys/module/kvm_intel/parameters/nested</code> מחזיר <code>Y</code>, וה-guest ברמה L1 צריך CPU mode של <code>host-passthrough</code>. תצפה לפגיעה אמיתית בביצועים ב-workloads עם הרבה exits. התמיכה בענן משתנה: GCP ו-Azure (הרבה גדלים מ-v3 ומעלה) תומכים; ב-AWS התשובה המסורתית הייתה instances מסוג <code>.metal</code> — תבדוק את התיעוד העדכני לכל משפחת instances.</p>
<p><strong>microVMs</strong>: <strong>Firecracker</strong> (של AWS, ב-Rust) הוא VMM מינימלי מעל KVM — בלי BIOS, בלי PCI, רק virtio-net, ‏virtio-block, ‏serial console ועוד כמה התקנים. עולה בערך ב-125 ms עם overhead של פחות מ-5 MiB זיכרון לכל microVM; הוא מריץ את AWS Lambda ו-Fargate. ‏Cloud Hypervisor ו-Kata Containers משתמשים באותו רעיון כדי לתת לכל container או pod kernel משלו (ראה <code>container-runtimes-oci</code>). ה-trade-off: בידוד ברמת VM כמעט במהירות של container, אבל בלי live migration ועם מעט התקנים.</p>
<p><strong>KubeVirt</strong> מריץ VMs כאובייקטים של Kubernetes: ‏CRD בשם <code>VirtualMachine</code>, כל VM בתוך pod של <code>virt-launcher</code> שמריץ libvirt + QEMU/KVM, דיסקים כ-PVCs (מיובאים ע"י CDI), ורשת דרך ה-pod network או Multus. זה המנוע של OpenShift Virtualization ויעד נחיתה נפוץ ליציאה מ-VMware — פלטפורמה אחת ל-containers ול-VMs שעוד אי אפשר להכניס ל-container.</p>
${PRE_KUBEVIRT}
<p><strong>איך instances בענן עובדים</strong>: <strong>AWS Nitro</strong> (מאז 2017, ‏C5) העביר את הרשת (ENA), ‏EBS (שנחשף כ-NVMe), ה-instance storage, ה-monitoring והאבטחה לכרטיסי Nitro ייעודיים ולשבב אבטחה, והשאיר <strong>Nitro Hypervisor</strong> דק מבוסס KVM שעושה כמעט רק CPU וזיכרון. התוצאה: כמעט כל משאבי ה-host הולכים ללקוחות, ביצועים קרובים ל-bare metal, ו-instances מסוג <code>.metal</code> שהם אותה חומרה בלי hypervisor בכלל. דורות ישנים של AWS רצו על Xen. <strong>GCP</strong> משתמש ב-KVM עם VMM מוקשח משלו; <strong>Azure</strong> משתמש ב-hypervisor שנגזר מ-Hyper-V ועוד offload ל-FPGA/DPU ‏(Azure Boost).</p>
<blockquote>💡 מהשטח: כשהדיסק של ה-EC2 שלך מופיע כ-<code>/dev/nvme1n1</code> ולא כ-<code>/dev/xvdf</code>, זה Nitro — כרטיס ה-Nitro מציג את EBS כהתקן NVMe. תתקין דרייבר NVMe ב-AMIs מותאמים, ותשתמש ב-<code>ebsnvme-id</code> או ב-symlinks של ההתקנים כדי למפות volumes בצורה אמינה.</blockquote>`
      )
    }
  ],
  diagram: "  guest apps            guest apps\n  guest kernel (virtio) guest kernel (virtio)\n        |  VM exit / virtqueue kick |\n  +--------------------------------------+\n  | QEMU process (devices)  QEMU process |   <- libvirt / virsh / KubeVirt\n  +--------------------------------------+\n  | Linux kernel + KVM module (/dev/kvm) |\n  +--------------------------------------+\n  | CPU: VT-x/AMD-V + EPT/NPT + VT-d     |\n\nlive migration (pre-copy): copy RAM -> resend dirty pages x N -> pause ~100-300 ms -> resume on host B",
  handsOn: [
    { cmd: "grep -Ec '(vmx|svm)' /proc/cpuinfo && sudo virt-host-validate qemu", what: t("Confirm the CPU exposes VT-x/AMD-V and the host is ready for KVM.", "לוודא שהמעבד חושף VT-x/AMD-V ושה-host מוכן ל-KVM.") },
    { cmd: "virsh list --all && virsh dominfo web01 && virsh vcpuinfo web01", what: t("See VMs, their memory/vCPU config and which physical CPUs each vCPU runs on.", "לראות את ה-VMs, את הגדרות הזיכרון וה-vCPU שלהן, ועל איזה CPU פיזי רץ כל vCPU.") },
    { cmd: "vmstat 1 5   # inside a guest: watch the 'st' column", what: t("Measure steal time: CPU the guest wanted but the hypervisor gave to another VM.", "למדוד steal time: זמן CPU שה-guest רצה וה-hypervisor נתן ל-VM אחרת.") },
    { cmd: "virsh migrate --live --persistent --undefinesource web01 qemu+ssh://kvm02/system --verbose", what: t("Live-migrate a VM between two KVM hosts that share storage.", "לבצע live migration ל-VM בין שני hosts של KVM שחולקים storage.") },
    { cmd: "cat /sys/module/kvm_intel/parameters/nested; lscpu | grep -i numa", what: t("Check nested virtualization support and the NUMA layout before sizing big VMs.", "לבדוק תמיכה ב-nested virtualization ואת מבנה ה-NUMA לפני שמתכננים VMs גדולות.") }
  ],
  mnemonic: t(
    "\"KQLV\": KVM runs it, QEMU fakes the hardware, Libvirt manages it, Virtio makes it fast. And: overcommit CPU, respect RAM, pin NUMA, snapshots aren't backups.",
    "\"KQLV\": ‏KVM מריץ, QEMU מזייף את החומרה, Libvirt מנהל, Virtio מאיץ. ובנוסף: overcommit ל-CPU, כבוד ל-RAM, ‏pinning ל-NUMA, ו-snapshot זה לא גיבוי."
  ),
  pitfalls: [
    t("Using emulated devices (IDE, e1000, rtl8139) because the template defaulted to them — IO throughput can be 3-5x lower than virtio and CPU burns on VM exits.", "שימוש בהתקנים מודמים (IDE, ‏e1000, ‏rtl8139) כי זה מה שהיה ב-template — ה-throughput של IO יכול להיות נמוך פי 3-5 מ-virtio, וה-CPU נשרף על VM exits."),
    t("Memory overcommit on hosts running databases or Kubernetes nodes: ballooning and host swap make latency unpredictable and trigger OOM kills that look random from inside the guest.", "Memory overcommit על hosts שמריצים מסדי נתונים או nodes של Kubernetes: ‏ballooning ו-swap ב-host הופכים את ה-latency ללא צפוי וגורמים ל-OOM kills שנראים אקראיים מתוך ה-guest."),
    t("Treating VM snapshots as backups and leaving them for weeks: the delta fills the datastore, every VM on it pauses, and consolidation causes an IO storm.", "להתייחס ל-snapshots של VM כגיבויים ולהשאיר אותם שבועות: ה-delta ממלא את ה-datastore, כל ה-VMs עליו נעצרות, וה-consolidation גורם לסערת IO."),
    t("Assuming HA means zero downtime: vSphere HA and Proxmox HA restart VMs after a host failure (minutes), they don't keep them running; that's FT or application-level redundancy.", "להניח ש-HA אומר אפס downtime: ‏HA של vSphere ושל Proxmox מפעיל מחדש VMs אחרי נפילת host (דקות), הוא לא משאיר אותן רצות; בשביל זה יש FT או יתירות ברמת האפליקציה.")
  ],
  interview: [
    { q: t("A VM's live migration has been running for 20 minutes and never finishes. What's happening and what do you do?", "Live migration של VM רץ כבר 20 דקות ולא מסתיים. מה קורה ומה אתה עושה?"),
      a: t("Pre-copy isn't converging: the guest dirties pages faster than the migration link can send them (e.g. a busy in-memory DB on 10 Gb/s). Check virsh domjobinfo for dirty rate vs bandwidth. Options: move it at a quieter time, use a faster dedicated migration network, enable auto-converge to throttle the guest's vCPUs, raise the allowed downtime, or switch to post-copy (accepting that a network failure mid-migration loses the VM).", "ה-pre-copy לא מתכנס: ה-guest מלכלך דפים מהר יותר ממה שהלינק מעביר (למשל DB בזיכרון שעמוס, על 10 Gb/s). בודקים ב-virsh domjobinfo את ה-dirty rate מול ה-bandwidth. אפשרויות: להעביר בשעה שקטה, רשת migration ייעודית ומהירה יותר, להפעיל auto-converge שמאט את ה-vCPUs של ה-guest, להגדיל את ה-downtime המותר, או לעבור ל-post-copy (ולקבל שנפילת רשת באמצע מאבדת את ה-VM).") },
    { q: t("Your company wants to leave VMware after a big renewal quote. How do you plan it?", "החברה רוצה לעזוב את VMware אחרי הצעת חידוש גבוהה. איך אתה מתכנן את זה?"),
      a: t("Inventory first: VM count, OS mix, which vSphere features are really used (DRS, vSAN, NSX micro-segmentation, SRM, FT), backup and monitoring integrations. Pick targets per workload class: Proxmox/Hyper-V/Nutanix for classic VMs, KubeVirt/OpenShift Virtualization where a Kubernetes platform exists, refactor or move to cloud where it makes sense. Pilot with low-risk VMs, script conversions (VMDK to qcow2/raw, virtio drivers pre-installed, guest agents), rebuild network policy and DR, migrate in waves with rollback, and negotiate a shorter bridging renewal to avoid a forced big-bang.", "קודם inventory: כמה VMs, תמהיל מערכות הפעלה, באילו יכולות של vSphere באמת משתמשים (DRS, ‏vSAN, ‏micro-segmentation של NSX, ‏SRM, ‏FT), ואינטגרציות של גיבוי ו-monitoring. בוחרים יעד לכל סוג workload: ‏Proxmox/Hyper-V/Nutanix ל-VMs קלאסיות, ‏KubeVirt/OpenShift Virtualization איפה שיש פלטפורמת Kubernetes, ו-refactor או מעבר לענן איפה שזה הגיוני. Pilot על VMs בסיכון נמוך, סקריפטים להמרות (VMDK ל-qcow2/raw, דרייברים של virtio מותקנים מראש, guest agents), בנייה מחדש של מדיניות רשת ו-DR, מיגרציה בגלים עם rollback, ומשא ומתן על חידוש גישור קצר כדי לא להיגרר ל-big-bang.") },
    { q: t("Why can a 16-vCPU VM run slower than an 8-vCPU VM on the same host?", "למה VM עם 16 vCPUs יכולה לרוץ לאט יותר מ-VM עם 8 vCPUs על אותו host?"),
      a: t("NUMA and scheduling. If 16 vCPUs don't fit in one NUMA node, vCPUs and memory span sockets and many accesses become remote (1.3-2x latency). On an overcommitted host, a wide VM also waits longer to get all its vCPUs scheduled (high steal / CPU Ready). Right-size to fit a NUMA node, pin vCPUs and memory, and use hugepages for databases.", "NUMA ותזמון. אם 16 vCPUs לא נכנסים ב-NUMA node אחד, ה-vCPUs והזיכרון מתפרסים על sockets והרבה גישות נהיות מרוחקות (latency פי 1.3-2). על host עם overcommit, VM רחבה גם מחכה יותר זמן עד שכל ה-vCPUs שלה מתוזמנים (steal או CPU Ready גבוהים). מתאימים את הגודל ל-NUMA node, עושים pinning ל-vCPUs ולזיכרון, ומשתמשים ב-hugepages למסדי נתונים.") }
  ],
  quiz: [
    { q: t("What does EPT (Intel) / NPT (AMD) do?", "מה EPT ‏(Intel) / NPT ‏(AMD) עושה?"),
      options: [
        t("Encrypts guest memory so the host can't read it", "מצפין את הזיכרון של ה-guest כך שה-host לא יכול לקרוא אותו"),
        t("Translates guest-physical to host-physical addresses in hardware, replacing shadow page tables", "מתרגם בחומרה כתובות guest-physical ל-host-physical, במקום shadow page tables"),
        t("Lets a VM access a PCI device directly", "מאפשר ל-VM לגשת ישירות להתקן PCI"),
        t("Copies dirty pages during live migration", "מעתיק דפים מלוכלכים בזמן live migration")
      ], answer: 1,
      explain: t("EPT/NPT is second-level address translation: the MMU walks both the guest's and the hypervisor's page tables, so the hypervisor no longer maintains shadow page tables. Direct PCI access is VT-d/IOMMU; memory encryption is SEV/TDX.", "EPT/NPT הוא תרגום כתובות דו-שלבי: ה-MMU עובר גם על ה-page tables של ה-guest וגם על של ה-hypervisor, כך שה-hypervisor כבר לא מתחזק shadow page tables. גישה ישירה ל-PCI זה VT-d/IOMMU; הצפנת זיכרון זה SEV/TDX.") },
    { q: t("Inside a VM, top shows 25% in the 'st' column. What does that mean?", "בתוך VM, ‏top מראה 25% בעמודת 'st'. מה זה אומר?"),
      options: [
        t("The disk is slow (storage time)", "הדיסק איטי (storage time)"),
        t("The guest kernel is stuck in system calls", "ה-kernel של ה-guest תקוע ב-system calls"),
        t("The vCPU wanted to run but the hypervisor ran other VMs — the host is CPU-overcommitted", "ה-vCPU רצה לרוץ אבל ה-hypervisor הריץ VMs אחרות — יש overcommit של CPU ב-host"),
        t("The VM is being live-migrated", "ה-VM נמצאת ב-live migration")
      ], answer: 2,
      explain: t("Steal time is CPU time stolen by the hypervisor for other guests. 25% is severe: move the VM, reduce the host's vCPU:pCPU ratio, or right-size noisy neighbors.", "Steal time הוא זמן CPU שה-hypervisor 'גנב' בשביל guests אחרים. 25% זה חמור: להעביר את ה-VM, להוריד את יחס ה-vCPU:pCPU ב-host, או להקטין שכנים רועשים.") },
    { q: t("vSphere HA is enabled and an ESXi host loses power. What happens to its VMs?", "vSphere HA מופעל ו-host של ESXi מאבד חשמל. מה קורה ל-VMs שלו?"),
      options: [
        t("They keep running with zero downtime via vMotion", "הן ממשיכות לרוץ בלי downtime בכלל בעזרת vMotion"),
        t("They are restarted on surviving hosts, with a few minutes of downtime", "הן מופעלות מחדש על hosts ששרדו, עם כמה דקות downtime"),
        t("DRS restores them from the last snapshot", "DRS משחזר אותן מה-snapshot האחרון"),
        t("Nothing until an admin intervenes", "כלום, עד שאדמין מתערב")
      ], answer: 1,
      explain: t("HA is a restart mechanism. vMotion needs a running source host, so it can't help after a crash. Zero-downtime protection is Fault Tolerance (lock-step secondary) or app-level redundancy.", "HA הוא מנגנון restart. ‏vMotion צריך host מקור שרץ, אז הוא לא עוזר אחרי קריסה. הגנה בלי downtime זה Fault Tolerance ‏(secondary שרץ ב-lock-step) או יתירות ברמת האפליקציה.") },
    { q: t("What powers AWS Lambda's per-invocation isolation?", "מה מספק את הבידוד של כל הרצה ב-AWS Lambda?"),
      options: [
        t("Docker containers sharing the host kernel", "Docker containers שחולקים את ה-kernel של ה-host"),
        t("Full ESXi VMs", "VMs מלאות של ESXi"),
        t("Firecracker microVMs on KVM", "microVMs של Firecracker מעל KVM"),
        t("KubeVirt", "KubeVirt")
      ], answer: 2,
      explain: t("Firecracker is a minimal KVM-based VMM (~125 ms boot, <5 MiB overhead) built for Lambda and Fargate: VM-grade isolation at container-like density.", "Firecracker הוא VMM מינימלי מבוסס KVM (עלייה בערך ב-125 ms, ‏overhead של פחות מ-5 MiB) שנבנה ל-Lambda ול-Fargate: בידוד ברמת VM בצפיפות של containers.") }
  ],
  related: ["vms", "cpu", "memory", "container-runtimes-oci", "cloud-serverless", "distributed-storage-ceph"]
});

// ======================= LESSON 2: distributed-storage-ceph =======================
INFRA.lessons.push({
  id: "distributed-storage-ceph",
  track: "foundations",
  order: 62,
  icon: "🗄️",
  level: 3,
  minutes: 16,
  title: t("Enterprise & Distributed Storage: SAN, iSCSI, Ceph", "אחסון ארגוני ומבוזר: SAN, ‏iSCSI, ‏Ceph"),
  tldr: t(
    "Block storage reaches servers three ways — local (DAS), over a file protocol (NAS) or as raw LUNs over a network (SAN: iSCSI, Fibre Channel, NVMe-oF, always with multipath). Ceph replaces the big array with commodity servers: CRUSH computes where every object lives, OSDs replicate or erasure-code it, and RBD/CephFS/RGW expose block, file and S3. The rule that bites everyone: 3x replication means a third of raw capacity, and at 95% full on any single OSD, writes stop.",
    "Block storage מגיע לשרתים בשלוש דרכים — מקומי (DAS), דרך פרוטוקול קבצים (NAS), או כ-LUNs גולמיים ברשת (SAN: ‏iSCSI, ‏Fibre Channel, ‏NVMe-oF, תמיד עם multipath). ‏Ceph מחליף את המערך הגדול בשרתים רגילים: ‏CRUSH מחשב איפה כל אובייקט יושב, ה-OSDs משכפלים אותו או עושים לו erasure coding, ו-RBD/CephFS/RGW חושפים block, ‏file ו-S3. הכלל שנושך את כולם: replication של 3x אומר שליש מהקיבולת הגולמית, וכש-OSD בודד מגיע ל-95%, הכתיבות נעצרות."
  ),
  analogy: t(
    "DAS is a bookshelf in your room. NAS is a library: you ask the librarian for a book by title (files). SAN is a warehouse that hands you an empty, numbered shelf unit over a private road (raw blocks) — what you put on it is your business. Ceph is a chain of hundreds of small warehouses run by a formula: instead of a central catalogue clerk, everyone (including the customer) can compute from the book's name exactly which three warehouses hold copies. When one warehouse burns down, the others quietly re-copy its books — and if they're already 90% full, that re-copying is what fills them to the ceiling.",
    "DAS זה מדף ספרים בחדר שלך. NAS זו ספרייה: אתה מבקש מהספרן ספר לפי שם (קבצים). SAN זה מחסן שנותן לך יחידת מדפים ריקה וממוספרת דרך כביש פרטי (blocks גולמיים) — מה ששמים עליה זה עניין שלך. Ceph זו רשת של מאות מחסנים קטנים שמנוהלת לפי נוסחה: במקום פקיד קטלוג מרכזי, כל אחד (כולל הלקוח) יכול לחשב משם הספר בדיוק באילו שלושה מחסנים יש עותקים. כשמחסן אחד נשרף, האחרים מעתיקים מחדש את הספרים שלו בשקט — ואם הם כבר מלאים ב-90%, ההעתקה הזאת היא מה שממלא אותם עד התקרה."
  ),
  sections: [
    {
      h: t("DAS vs NAS vs SAN, and where cloud fits", "DAS מול NAS מול SAN, ואיפה הענן נכנס"),
      body: t(
        `<table><tr><th></th><th>DAS (Direct-Attached)</th><th>NAS (Network-Attached)</th><th>SAN (Storage Area Network)</th></tr>
<tr><td>What the server sees</td><td>A local disk (SATA/SAS/NVMe)</td><td>A shared <strong>filesystem</strong> (NFS, SMB)</td><td>A raw <strong>block device</strong> (LUN) it formats itself</td></tr>
<tr><td>Protocol</td><td>SATA, SAS, PCIe/NVMe</td><td>NFS (TCP 2049), SMB (TCP 445)</td><td>iSCSI (TCP 3260), Fibre Channel, NVMe-oF (NVMe/TCP 4420, RoCE, FC)</td></tr>
<tr><td>Sharing</td><td>One host</td><td>Many clients, same files</td><td>Usually one host per LUN (or a cluster FS: VMFS, CSV, GFS2)</td></tr>
<tr><td>Latency</td><td>~10-100 µs (NVMe)</td><td>~0.3-2 ms</td><td>~0.1-1 ms (FC/NVMe-oF lowest)</td></tr>
<tr><td>Typical use</td><td>Databases on local NVMe, Kafka, Ceph OSDs themselves</td><td>Home dirs, shared assets, CI caches</td><td>VMware datastores, Oracle/SQL Server, clustered apps</td></tr>
<tr><td>Cloud equivalent</td><td>Instance store / local SSD</td><td>EFS, Azure Files, Filestore, FSx</td><td>EBS, Azure Managed Disks, Persistent Disk</td></tr></table>
<p>For NFS vs SMB details (versions, locking, permissions) see <code>filesystems-compared</code>; for RAID inside a single array see <code>raid-levels-deep</code>. This lesson is about storage that lives <em>across the network</em> and <em>across servers</em>.</p>
<blockquote>💡 Real world: "SAN vs NAS" is mostly about the abstraction, not the box. A NetApp can serve NFS shares and iSCSI LUNs from the same controller; EBS is a SAN-like block service that AWS built on its own distributed storage and delivers to the instance over the Nitro card as NVMe.</blockquote>`,
        `<table><tr><th></th><th>DAS ‏(Direct-Attached)</th><th>NAS ‏(Network-Attached)</th><th>SAN ‏(Storage Area Network)</th></tr>
<tr><td>מה השרת רואה</td><td>דיסק מקומי (SATA/SAS/NVMe)</td><td><strong>Filesystem</strong> משותף (NFS, ‏SMB)</td><td><strong>Block device</strong> גולמי (LUN) שהוא מפרמט בעצמו</td></tr>
<tr><td>פרוטוקול</td><td>SATA, ‏SAS, ‏PCIe/NVMe</td><td>NFS ‏(TCP 2049), ‏SMB ‏(TCP 445)</td><td>iSCSI ‏(TCP 3260), ‏Fibre Channel, ‏NVMe-oF ‏(NVMe/TCP 4420, ‏RoCE, ‏FC)</td></tr>
<tr><td>שיתוף</td><td>host אחד</td><td>הרבה clients, אותם קבצים</td><td>בדרך כלל host אחד לכל LUN (או cluster FS: ‏VMFS, ‏CSV, ‏GFS2)</td></tr>
<tr><td>Latency</td><td>בערך 10-100 µs ‏(NVMe)</td><td>בערך 0.3-2 ms</td><td>בערך 0.1-1 ms ‏(FC/NVMe-oF הכי נמוך)</td></tr>
<tr><td>שימוש טיפוסי</td><td>מסדי נתונים על NVMe מקומי, Kafka, ה-OSDs של Ceph עצמם</td><td>תיקיות בית, assets משותפים, caches של CI</td><td>datastores של VMware, ‏Oracle/SQL Server, אפליקציות ב-cluster</td></tr>
<tr><td>המקבילה בענן</td><td>Instance store / local SSD</td><td>EFS, ‏Azure Files, ‏Filestore, ‏FSx</td><td>EBS, ‏Azure Managed Disks, ‏Persistent Disk</td></tr></table>
<p>לפרטים על NFS מול SMB (גרסאות, locking, הרשאות) ראה <code>filesystems-compared</code>; ל-RAID בתוך מערך בודד ראה <code>raid-levels-deep</code>. השיעור הזה עוסק באחסון שחי <em>על פני הרשת</em> ו<em>על פני שרתים</em>.</p>
<blockquote>💡 מהשטח: "SAN מול NAS" זה בעיקר עניין של אבסטרקציה, לא של קופסה. NetApp יכול להגיש shares של NFS ו-LUNs של iSCSI מאותו controller; ‏EBS הוא שירות block בסגנון SAN ש-AWS בנתה על אחסון מבוזר משלה ומגישה ל-instance דרך כרטיס ה-Nitro כ-NVMe.</blockquote>`
      )
    },
    {
      h: t("iSCSI, Fibre Channel, multipath", "iSCSI, ‏Fibre Channel ו-multipath"),
      body: t(
        `<p><strong>iSCSI</strong> carries SCSI commands over TCP. Vocabulary: the <strong>target</strong> is the storage side (array, TrueNAS, Linux LIO via <code>targetcli</code>), the <strong>initiator</strong> is the client (<code>open-iscsi</code>, Windows iSCSI Initiator, ESXi software adapter), a <strong>LUN</strong> is a numbered block device exported by a target, and everything is named by an <strong>IQN</strong> like <code>iqn.2005-10.org.freenas.ctl:db-lun</code>. Access control = initiator IQN ACLs on the target + CHAP authentication.</p>
${PRE_ISCSI}
<p><strong>Fibre Channel</strong>: a dedicated lossless network (16/32/64 Gb FC) with its own switches ("fabric"), HBAs in servers, and WWPNs as addresses. Two access controls: <strong>zoning</strong> on the switches (which WWPNs may talk — best practice is single-initiator zoning: one server HBA + its target ports per zone) and <strong>LUN masking</strong> on the array (which hosts see which LUNs). Always two independent fabrics (A and B). Newer builds increasingly pick <strong>NVMe/TCP</strong> over plain Ethernet instead: NVMe semantics, no FC switches, latency close to local NVMe.</p>
<p><strong>Multipath</strong>: every SAN host gets at least two paths (two NICs/HBAs → two switches → two array controllers). Linux <code>dm-multipath</code> merges the duplicate <code>/dev/sdX</code> devices into one <code>/dev/mapper/mpathX</code>, fails over when a path dies, and with ALUA prefers the "optimized" controller. Use separate storage VLANs/subnets per path, jumbo frames (MTU 9000) end to end, and never route iSCSI through a firewall.</p>
<blockquote>⚠️ Production tip: format and mount the multipath device, never the underlying <code>/dev/sdb</code>. If you mount a single path, a switch reboot becomes an IO error and a read-only filesystem. And set <code>no_path_retry</code>/<code>queue_if_no_path</code> deliberately: queueing forever hides an outage as a hung app; failing fast surfaces it.</blockquote>`,
        `<p><strong>iSCSI</strong> מעביר פקודות SCSI מעל TCP. מילון: ה-<strong>target</strong> הוא צד האחסון (מערך, TrueNAS, או LIO של Linux דרך <code>targetcli</code>), ה-<strong>initiator</strong> הוא ה-client ‏(<code>open-iscsi</code>, ‏iSCSI Initiator של Windows, ה-software adapter של ESXi), ‏<strong>LUN</strong> הוא block device ממוספר שה-target מייצא, והכל נקרא לפי <strong>IQN</strong> כמו <code>iqn.2005-10.org.freenas.ctl:db-lun</code>. בקרת גישה = ACLs לפי ה-IQN של ה-initiator על ה-target, ועוד אימות CHAP.</p>
${PRE_ISCSI}
<p><strong>Fibre Channel</strong>: רשת ייעודית בלי איבוד פקטות (16/32/64 Gb FC) עם switches משלה ("fabric"), כרטיסי HBA בשרתים, ו-WWPNs ככתובות. שתי שכבות של בקרת גישה: <strong>zoning</strong> על ה-switches (אילו WWPNs מורשים לדבר — ה-best practice הוא single-initiator zoning: ‏HBA אחד של שרת ופורטי ה-target שלו בכל zone) ו-<strong>LUN masking</strong> על המערך (אילו hosts רואים אילו LUNs). תמיד שני fabrics עצמאיים (A ו-B). בהקמות חדשות בוחרים יותר ויותר ב-<strong>NVMe/TCP</strong> מעל Ethernet רגיל: סמנטיקה של NVMe, בלי switches של FC, ו-latency קרוב ל-NVMe מקומי.</p>
<p><strong>Multipath</strong>: כל host ב-SAN מקבל לפחות שני מסלולים (שני NICs או HBAs ← שני switches ← שני controllers במערך). ‏<code>dm-multipath</code> ב-Linux מאחד את התקני ה-<code>/dev/sdX</code> הכפולים ל-<code>/dev/mapper/mpathX</code> אחד, עושה failover כשמסלול מת, ועם ALUA מעדיף את ה-controller ה"אופטימלי". תשתמש ב-VLANs או subnets נפרדים של storage לכל מסלול, jumbo frames ‏(MTU 9000) מקצה לקצה, ואף פעם אל תנתב iSCSI דרך firewall.</p>
<blockquote>⚠️ טיפ לפרודקשן: מפרמטים ועושים mount להתקן ה-multipath, אף פעם לא ל-<code>/dev/sdb</code> שמתחתיו. אם עשית mount למסלול בודד, reboot של switch הופך לשגיאת IO ול-filesystem במצב read-only. ותגדיר את <code>no_path_retry</code>/<code>queue_if_no_path</code> בכוונה: תור אינסופי מסתיר outage כאפליקציה תקועה; כישלון מהיר חושף אותו.</blockquote>`
      )
    },
    {
      h: t("Ceph architecture: RADOS, MON/MGR/OSD, CRUSH, PGs, pools", "הארכיטקטורה של Ceph: ‏RADOS, ‏MON/MGR/OSD, ‏CRUSH, ‏PGs ו-pools"),
      body: t(
        `<p><strong>RADOS</strong> (Reliable Autonomic Distributed Object Store) is the core: a self-healing cluster that stores objects. Everything else is a client of it.</p>
<table><tr><th>Daemon</th><th>Role</th><th>How many</th></tr>
<tr><td><strong>MON</strong></td><td>Holds the cluster maps (MON, OSD, PG, CRUSH, MDS) and agrees on them via Paxos. Needs a majority quorum</td><td>3 (small) or 5 (large); odd</td></tr>
<tr><td><strong>MGR</strong></td><td>Metrics, dashboard, Prometheus exporter, orchestrator (cephadm), balancer and PG autoscaler modules</td><td>2 (active + standby)</td></tr>
<tr><td><strong>OSD</strong></td><td>One per disk (BlueStore writes straight to the raw device). Stores data, replicates to peers, heartbeats, recovers, scrubs</td><td>Tens to thousands</td></tr>
<tr><td>MDS</td><td>Metadata server for CephFS only</td><td>1+ active, standbys</td></tr>
<tr><td>RGW</td><td>S3/Swift HTTP gateway</td><td>2+ behind a load balancer</td></tr></table>
<p><strong>How data finds its place</strong> — no central lookup table:</p>
<ol><li>An object (e.g. a 4 MiB chunk of an RBD image) belongs to a <strong>pool</strong>.</li>
<li>The pool is split into <strong>placement groups</strong> (PGs): <code>pg = hash(object_name) mod pg_num</code>.</li>
<li><strong>CRUSH</strong> (a deterministic pseudo-random algorithm) maps each PG to an ordered list of OSDs, using the CRUSH map: a hierarchy (root → datacenter → rack → host → osd) with weights (≈ TiB) and rules like "3 copies, each on a different <em>host</em>" (the <strong>failure domain</strong>).</li>
<li>Clients compute this themselves from the maps and talk to the primary OSD directly — which is why Ceph scales without a metadata bottleneck.</li></ol>
<p>PGs are the unit of placement and recovery. The autoscaler targets ~100 PGs per OSD (<code>mon_target_pg_per_osd</code>); too few PGs = uneven fill, too many = memory and peering overhead.</p>
<table><tr><th>Pool type</th><th>Example</th><th>Raw overhead</th><th>Survives</th><th>Min failure domains</th><th>Best for</th></tr>
<tr><td>Replicated</td><td><code>size=3, min_size=2</code></td><td>3.0x (33% usable)</td><td>2 lost copies (IO continues with 1 lost)</td><td>3</td><td>RBD for VMs/DBs, CephFS metadata, small objects</td></tr>
<tr><td>Erasure coded</td><td><code>k=4, m=2</code></td><td>1.5x (67% usable)</td><td>Any 2 of 6 chunks</td><td>6 (7+ to heal)</td><td>RGW/S3 bulk data, backups, archives</td></tr>
<tr><td>Erasure coded</td><td><code>k=8, m=3</code></td><td>1.375x (73%)</td><td>Any 3 of 11</td><td>11 (12+)</td><td>Large object stores</td></tr></table>
<p>EC costs more CPU and has worse small-write latency (read-modify-write across k+m OSDs), so the usual design is replicated pools for block and EC for objects. With <code>min_size=2</code>, a PG that drops to one copy <strong>stops serving IO</strong> (inactive) rather than risk losing the only copy — never set <code>min_size=1</code> in production.</p>
<p>Interfaces on top of RADOS: <strong>RBD</strong> (block devices for VMs/Kubernetes, thin, snapshots, mirroring), <strong>CephFS</strong> (POSIX filesystem, needs MDS), <strong>RGW</strong> (S3/Swift object storage, multisite replication).</p>`,
        `<p><strong>RADOS</strong> ‏(Reliable Autonomic Distributed Object Store) הוא הליבה: cluster שמרפא את עצמו ומאחסן אובייקטים. כל השאר הם clients שלו.</p>
<table><tr><th>Daemon</th><th>תפקיד</th><th>כמה</th></tr>
<tr><td><strong>MON</strong></td><td>מחזיק את מפות ה-cluster ‏(MON, ‏OSD, ‏PG, ‏CRUSH, ‏MDS) ומגיע עליהן להסכמה דרך Paxos. צריך quorum של רוב</td><td>3 (קטן) או 5 (גדול); מספר אי-זוגי</td></tr>
<tr><td><strong>MGR</strong></td><td>מטריקות, dashboard, ‏Prometheus exporter, ‏orchestrator ‏(cephadm), ומודולים של balancer ו-PG autoscaler</td><td>2 ‏(active + standby)</td></tr>
<tr><td><strong>OSD</strong></td><td>אחד לכל דיסק (BlueStore כותב ישירות להתקן הגולמי). מאחסן נתונים, משכפל ל-peers, שולח heartbeats, מתאושש ועושה scrub</td><td>עשרות עד אלפים</td></tr>
<tr><td>MDS</td><td>שרת metadata רק בשביל CephFS</td><td>1+ פעילים, ועוד standbys</td></tr>
<tr><td>RGW</td><td>Gateway של HTTP ל-S3/Swift</td><td>2+ מאחורי load balancer</td></tr></table>
<p><strong>איך נתון מוצא את המקום שלו</strong> — בלי טבלת חיפוש מרכזית:</p>
<ol><li>אובייקט (למשל chunk של 4 MiB מתוך image של RBD) שייך ל-<strong>pool</strong>.</li>
<li>ה-pool מחולק ל-<strong>placement groups</strong> ‏(PGs): <code>pg = hash(object_name) mod pg_num</code>.</li>
<li><strong>CRUSH</strong> (אלגוריתם דטרמיניסטי פסאודו-אקראי) ממפה כל PG לרשימה מסודרת של OSDs, לפי ה-CRUSH map: היררכיה (root ← datacenter ← rack ← host ← osd) עם משקלים (בערך TiB) וחוקים כמו "3 עותקים, כל אחד על <em>host</em> אחר" (ה-<strong>failure domain</strong>).</li>
<li>ה-clients מחשבים את זה בעצמם מהמפות ומדברים ישירות עם ה-OSD הראשי — ובגלל זה Ceph גדל בלי צוואר בקבוק של metadata.</li></ol>
<p>PGs הם יחידת המיקום וההתאוששות. ה-autoscaler מכוון לבערך 100 PGs לכל OSD ‏(<code>mon_target_pg_per_osd</code>); מעט מדי PGs = מילוי לא אחיד, יותר מדי = overhead של זיכרון ו-peering.</p>
<table><tr><th>סוג pool</th><th>דוגמה</th><th>Overhead גולמי</th><th>שורד</th><th>מינימום failure domains</th><th>הכי מתאים ל</th></tr>
<tr><td>Replicated</td><td><code>size=3, min_size=2</code></td><td>3.0x ‏(33% שמיש)</td><td>אובדן 2 עותקים (IO ממשיך עם עותק 1 שאבד)</td><td>3</td><td>RBD ל-VMs ולמסדי נתונים, metadata של CephFS, אובייקטים קטנים</td></tr>
<tr><td>Erasure coded</td><td><code>k=4, m=2</code></td><td>1.5x ‏(67% שמיש)</td><td>כל 2 מתוך 6 chunks</td><td>6 (7+ כדי להתאושש)</td><td>נתוני bulk של RGW/S3, גיבויים, ארכיון</td></tr>
<tr><td>Erasure coded</td><td><code>k=8, m=3</code></td><td>1.375x ‏(73%)</td><td>כל 3 מתוך 11</td><td>11 ‏(12+)</td><td>Object stores גדולים</td></tr></table>
<p>EC עולה יותר CPU ויש לו latency גרוע יותר בכתיבות קטנות (read-modify-write על פני k+m OSDs), ולכן התכנון המקובל הוא pools של replication ל-block ו-EC לאובייקטים. עם <code>min_size=2</code>, ‏PG שיורד לעותק אחד <strong>מפסיק לשרת IO</strong> (inactive) במקום להסתכן באובדן העותק היחיד — לעולם אל תגדיר <code>min_size=1</code> בפרודקשן.</p>
<p>הממשקים מעל RADOS: <strong>RBD</strong> ‏(block devices ל-VMs ול-Kubernetes, thin, ‏snapshots, ‏mirroring), <strong>CephFS</strong> ‏(filesystem של POSIX, צריך MDS), <strong>RGW</strong> ‏(object storage של S3/Swift, ‏multisite replication).</p>`
      )
    },
    {
      h: t("Operating Ceph: ceph -s, HEALTH_WARN, recovery, full ratios", "תפעול Ceph: ‏ceph -s, ‏HEALTH_WARN, התאוששות ו-full ratios"),
      body: t(
        `${PRE_CEPH_S}
<p>Read it top-down: health, quorum (all 3 MONs in?), <code>23 up, 24 in</code> (one OSD process is dead but still counted for placement), PG states, client IO. When an OSD goes <strong>down</strong>, Ceph waits <code>mon_osd_down_out_interval</code> (default 600 s) before marking it <strong>out</strong>; then CRUSH remaps its PGs and <strong>backfill/recovery</strong> re-creates the missing copies on other OSDs. For planned maintenance, <code>ceph osd set noout</code> first so a reboot doesn't trigger a full data reshuffle.</p>
<table><tr><th>Health code</th><th>Meaning</th><th>First move</th></tr>
<tr><td><code>OSD_DOWN</code></td><td>OSD daemon not heartbeating</td><td><code>ceph osd tree down</code>, check disk/host/<code>journalctl -u ceph-osd@N</code></td></tr>
<tr><td><code>PG_DEGRADED</code></td><td>Some objects have fewer copies than <code>size</code></td><td>Normal during recovery; watch it shrink</td></tr>
<tr><td><code>PG_AVAILABILITY</code> (inactive/down PGs)</td><td>PGs can't serve IO — clients hang</td><td>Urgent: <code>ceph health detail</code>, <code>ceph pg dump_stuck inactive</code>, bring OSDs back</td></tr>
<tr><td><code>OSD_NEARFULL</code></td><td>An OSD passed 85%</td><td>Plan capacity now, rebalance</td></tr>
<tr><td><code>OSD_BACKFILLFULL</code></td><td>An OSD passed 90%: it refuses incoming backfill</td><td>Recovery stalls (<code>backfill_toofull</code>); rebalance or add OSDs</td></tr>
<tr><td><code>OSD_FULL</code> (HEALTH_ERR)</td><td>An OSD passed 95%: the cluster blocks writes to affected pools</td><td>Emergency: add capacity / delete data; temporarily nudge the ratio</td></tr>
<tr><td><code>SLOW_OPS</code></td><td>Requests blocked &gt;30 s</td><td>Find the slow OSD/disk/network; often a dying disk</td></tr>
<tr><td><code>MON_CLOCK_SKEW</code></td><td>MON clocks differ &gt;0.05 s</td><td>Fix chrony/NTP</td></tr>
<tr><td><code>OSDMAP_FLAGS</code></td><td>noout/norebalance etc. still set</td><td>Unset after maintenance</td></tr></table>
<p><strong>Capacity is per-OSD, not per-cluster.</strong> The ratios (<code>ceph osd dump | grep ratio</code>): <strong>nearfull 0.85</strong>, <strong>backfillfull 0.90</strong>, <strong>full 0.95</strong>. One unlucky OSD at 95% blocks writes even if the cluster average is 70%. Check spread with <code>ceph osd df</code> (look at %USE and VAR) and keep the <code>balancer</code> module on in <code>upmap</code> mode.</p>
<p><strong>Recovery has a price</strong>: backfill competes with client IO. Since Quincy, OSDs use the <strong>mClock</strong> scheduler: <code>ceph config set osd osd_mclock_profile high_client_ops</code> to protect latency, <code>high_recovery_ops</code> to heal faster at night. On older releases you tune <code>osd_max_backfills</code> and <code>osd_recovery_max_active</code>.</p>
<p><strong>Capacity planning math</strong>: 4 hosts × 6 × 3.84 TB NVMe = 92 TB raw ≈ 83.8 TiB. With size=3: ≈ 27.9 TiB usable. Keep each OSD under 85% <em>after</em> losing your largest failure domain: with N equal hosts, safe fill ≈ 0.85 × (N−1)/N = 0.85 × 3/4 ≈ 64% → about <strong>17.8 TiB</strong> of real data. So "92 TB of disks" honestly means ~18 TiB of data you can promise.</p>
<blockquote>⚠️ Production tip: alert at 70-75% raw usage, not at nearfull. Ordering hardware, racking it and backfilling onto it takes weeks; the cluster can go from 80% to 95% in an afternoon when an OSD dies and its data has to land somewhere.</blockquote>`,
        `${PRE_CEPH_S}
<p>קוראים מלמעלה למטה: health, ‏quorum (כל 3 ה-MONs בפנים?), <code>23 up, 24 in</code> (תהליך OSD אחד מת אבל עדיין נספר לצורך מיקום), מצבי PGs, ‏IO של clients. כש-OSD הופך ל-<strong>down</strong>, ‏Ceph מחכה <code>mon_osd_down_out_interval</code> (ברירת מחדל 600 שניות) לפני שהוא מסמן אותו <strong>out</strong>; אז CRUSH ממפה מחדש את ה-PGs שלו ו-<strong>backfill/recovery</strong> יוצר מחדש את העותקים החסרים על OSDs אחרים. בתחזוקה מתוכננת, קודם <code>ceph osd set noout</code> כדי ש-reboot לא יפעיל ערבוב מלא של הנתונים.</p>
<table><tr><th>קוד health</th><th>משמעות</th><th>צעד ראשון</th></tr>
<tr><td><code>OSD_DOWN</code></td><td>ה-daemon של ה-OSD לא שולח heartbeats</td><td><code>ceph osd tree down</code>, לבדוק דיסק, host ו-<code>journalctl -u ceph-osd@N</code></td></tr>
<tr><td><code>PG_DEGRADED</code></td><td>לחלק מהאובייקטים יש פחות עותקים מ-<code>size</code></td><td>נורמלי בזמן התאוששות; לראות שזה קטן</td></tr>
<tr><td><code>PG_AVAILABILITY</code> ‏(PGs במצב inactive/down)</td><td>PGs לא יכולים לשרת IO — ה-clients נתקעים</td><td>דחוף: <code>ceph health detail</code>, <code>ceph pg dump_stuck inactive</code>, להחזיר OSDs</td></tr>
<tr><td><code>OSD_NEARFULL</code></td><td>OSD עבר 85%</td><td>לתכנן קיבולת עכשיו, לאזן</td></tr>
<tr><td><code>OSD_BACKFILLFULL</code></td><td>OSD עבר 90%: הוא מסרב לקבל backfill</td><td>ההתאוששות נתקעת (<code>backfill_toofull</code>); לאזן או להוסיף OSDs</td></tr>
<tr><td><code>OSD_FULL</code> ‏(HEALTH_ERR)</td><td>OSD עבר 95%: ה-cluster חוסם כתיבות ל-pools המושפעים</td><td>חירום: להוסיף קיבולת או למחוק נתונים; להזיז זמנית את ה-ratio</td></tr>
<tr><td><code>SLOW_OPS</code></td><td>בקשות תקועות יותר מ-30 שניות</td><td>למצוא את ה-OSD, הדיסק או הרשת האיטיים; הרבה פעמים דיסק גוסס</td></tr>
<tr><td><code>MON_CLOCK_SKEW</code></td><td>השעונים של ה-MONs שונים ביותר מ-0.05 שניות</td><td>לתקן chrony/NTP</td></tr>
<tr><td><code>OSDMAP_FLAGS</code></td><td>noout/norebalance וכו' עדיין מוגדרים</td><td>לבטל אחרי התחזוקה</td></tr></table>
<p><strong>הקיבולת נמדדת לכל OSD, לא לכל ה-cluster.</strong> ה-ratios ‏(<code>ceph osd dump | grep ratio</code>): <strong>nearfull 0.85</strong>, <strong>backfillfull 0.90</strong>, <strong>full 0.95</strong>. ‏OSD אחד חסר מזל ב-95% חוסם כתיבות גם אם הממוצע של ה-cluster הוא 70%. בודקים את הפיזור עם <code>ceph osd df</code> (מסתכלים על %USE ו-VAR) ומשאירים את מודול ה-<code>balancer</code> פעיל במצב <code>upmap</code>.</p>
<p><strong>להתאוששות יש מחיר</strong>: ה-backfill מתחרה ב-IO של ה-clients. מאז Quincy, ה-OSDs משתמשים ב-scheduler של <strong>mClock</strong>: ‏<code>ceph config set osd osd_mclock_profile high_client_ops</code> כדי להגן על ה-latency, ו-<code>high_recovery_ops</code> כדי להתאושש מהר יותר בלילה. בגרסאות ישנות מכווננים את <code>osd_max_backfills</code> ואת <code>osd_recovery_max_active</code>.</p>
<p><strong>החשבון של תכנון קיבולת</strong>: 4 hosts × 6 × 3.84 TB NVMe = 92 TB גולמי, בערך 83.8 TiB. עם size=3: בערך 27.9 TiB שמיש. צריך שכל OSD יישאר מתחת ל-85% <em>אחרי</em> אובדן ה-failure domain הכי גדול: עם N hosts זהים, מילוי בטוח ≈ 0.85 × (N−1)/N = 0.85 × 3/4, בערך 64% ← בערך <strong>17.8 TiB</strong> של נתונים אמיתיים. כלומר "92 TB של דיסקים" זה בכנות בערך 18 TiB של נתונים שאפשר להבטיח.</p>
<blockquote>⚠️ טיפ לפרודקשן: תגדיר alert ב-70-75% שימוש גולמי, לא ב-nearfull. הזמנת חומרה, התקנה בארון ו-backfill אליה לוקחים שבועות; ה-cluster יכול לעבור מ-80% ל-95% בצהריים אחד כש-OSD מת והנתונים שלו צריכים לנחות איפשהו.</blockquote>`
      )
    },
    {
      h: t("Ceph on Kubernetes (Rook), Longhorn, and the other options", "Ceph על Kubernetes ‏(Rook), ‏Longhorn, ושאר האפשרויות"),
      body: t(
        `<p><strong>Rook</strong> (CNCF graduated) is an operator that runs Ceph inside Kubernetes: you declare a <code>CephCluster</code>, pools and StorageClasses; Rook starts MON/MGR/OSD pods on the nodes' raw disks and wires up the Ceph CSI driver so PVCs become RBD images (RWO) or CephFS subvolumes (RWX). See <code>k8s-storage</code> for how PVC/StorageClass binding works.</p>
${PRE_ROOK}
<table><tr><th>Option</th><th>What it is</th><th>Good fit</th><th>Watch out</th></tr>
<tr><td><strong>Ceph (cephadm / Rook)</strong></td><td>Unified block + file + object, scales to PBs</td><td>Private cloud, OpenStack, Proxmox clusters, big k8s platforms</td><td>Operationally heavy; wants ≥3-5 nodes, fast network (25 Gb+), real expertise</td></tr>
<tr><td><strong>Longhorn</strong> (SUSE/Rancher, CNCF)</td><td>k8s-native block storage: each volume has its own engine + replicas (default 3) on node disks</td><td>Small/medium clusters, edge, simple RWO volumes, built-in backups to S3/NFS</td><td>Lower performance than Ceph on NVMe at scale; RWX via an NFS share-manager</td></tr>
<tr><td><strong>MinIO</strong></td><td>S3-compatible object storage with erasure coding</td><td>On-prem S3 for backups, data lakes</td><td>AGPLv3; in 2025 the community edition lost its admin web console and free prebuilt binaries — check current licensing before adopting</td></tr>
<tr><td><strong>GlusterFS</strong></td><td>Distributed file system</td><td>Legacy installs</td><td>Red Hat Gluster Storage reached end of life (2024) and upstream activity is low; Kubernetes removed its in-tree driver. Don't start new projects on it</td></tr>
<tr><td><strong>NetApp ONTAP</strong></td><td>Enterprise arrays/software: NFS, SMB, iSCSI, NVMe; snapshots, SnapMirror replication</td><td>Enterprises wanting one vendor and support; also as a managed cloud service (FSx for ONTAP, Azure NetApp Files)</td><td>Cost, vendor lock-in</td></tr>
<tr><td><strong>Pure Storage</strong></td><td>All-flash arrays (FlashArray block, FlashBlade file/object), always-on dedupe/compression</td><td>Databases and VMware/virtualization farms that need low, predictable latency</td><td>Cost; capacity quotes are often "effective" (after data reduction)</td></tr></table>
<blockquote>💡 Real world: a 3-node Proxmox cluster with Ceph on 1 GbE "works" in the lab and falls over in production — every write goes to 3 OSDs over the network, and recovery saturates the link. The common minimum for real use is 10 GbE (25 GbE for NVMe) with a separate cluster network, enterprise SSDs with power-loss protection, and no hardware RAID under OSDs (give Ceph raw disks; HBA/IT mode).</blockquote>`,
        `<p><strong>Rook</strong> ‏(CNCF graduated) הוא operator שמריץ Ceph בתוך Kubernetes: אתה מצהיר על <code>CephCluster</code>, ‏pools ו-StorageClasses; ‏Rook מעלה pods של MON/MGR/OSD על הדיסקים הגולמיים של ה-nodes ומחבר את ה-CSI driver של Ceph כך ש-PVCs הופכים ל-images של RBD ‏(RWO) או ל-subvolumes של CephFS ‏(RWX). ראה <code>k8s-storage</code> כדי להבין איך ה-binding של PVC ו-StorageClass עובד.</p>
${PRE_ROOK}
<table><tr><th>אפשרות</th><th>מה זה</th><th>מתאים ל</th><th>לשים לב</th></tr>
<tr><td><strong>Ceph ‏(cephadm / Rook)</strong></td><td>Block + file + object מאוחדים, גדל עד PBs</td><td>ענן פרטי, OpenStack, ‏clusters של Proxmox, פלטפורמות k8s גדולות</td><td>כבד תפעולית; רוצה לפחות 3-5 nodes, רשת מהירה (25 Gb ומעלה), ומומחיות אמיתית</td></tr>
<tr><td><strong>Longhorn</strong> ‏(SUSE/Rancher, ‏CNCF)</td><td>Block storage שנבנה ל-k8s: לכל volume יש engine משלו ו-replicas (ברירת מחדל 3) על הדיסקים של ה-nodes</td><td>Clusters קטנים ובינוניים, edge, ‏volumes פשוטים של RWO, גיבויים מובנים ל-S3/NFS</td><td>ביצועים נמוכים מ-Ceph על NVMe בסקייל; RWX דרך share-manager של NFS</td></tr>
<tr><td><strong>MinIO</strong></td><td>Object storage תואם S3 עם erasure coding</td><td>S3 ב-on-prem לגיבויים ול-data lakes</td><td>AGPLv3; ב-2025 גרסת ה-community איבדה את ה-web console לניהול ואת הבינאריים המוכנים בחינם — תבדוק את הרישוי העדכני לפני שאתה מאמץ</td></tr>
<tr><td><strong>GlusterFS</strong></td><td>File system מבוזר</td><td>התקנות legacy</td><td>Red Hat Gluster Storage הגיע ל-end of life ‏(2024) והפעילות ב-upstream נמוכה; Kubernetes הסיר את ה-driver המובנה שלו. לא מתחילים עליו פרויקטים חדשים</td></tr>
<tr><td><strong>NetApp ONTAP</strong></td><td>מערכים ותוכנה ארגוניים: NFS, ‏SMB, ‏iSCSI, ‏NVMe; ‏snapshots, ‏replication של SnapMirror</td><td>ארגונים שרוצים ספק אחד ותמיכה; גם כשירות מנוהל בענן (FSx for ONTAP, ‏Azure NetApp Files)</td><td>מחיר, vendor lock-in</td></tr>
<tr><td><strong>Pure Storage</strong></td><td>מערכי all-flash ‏(FlashArray ל-block, ‏FlashBlade ל-file/object), עם dedupe ודחיסה תמיד פעילים</td><td>מסדי נתונים וחוות וירטואליזציה של VMware שצריכות latency נמוך וצפוי</td><td>מחיר; הצעות קיבולת הן הרבה פעמים "effective" (אחרי הקטנת נתונים)</td></tr></table>
<blockquote>💡 מהשטח: cluster של Proxmox עם 3 nodes ו-Ceph על 1 GbE "עובד" במעבדה וקורס בפרודקשן — כל כתיבה הולכת ל-3 OSDs ברשת, וההתאוששות חונקת את הלינק. המינימום המקובל לשימוש אמיתי הוא 10 GbE ‏(25 GbE ל-NVMe) עם cluster network נפרד, SSDs ארגוניים עם power-loss protection, ובלי RAID חומרה מתחת ל-OSDs (נותנים ל-Ceph דיסקים גולמיים; HBA או IT mode).</blockquote>`
      )
    }
  ],
  diagram: "client (RBD / CephFS / RGW)\n   | object name -> hash -> PG -> CRUSH(map, rule) -> [osd.3 primary, osd.11, osd.20]\n   v  (no central lookup; client talks to the primary OSD directly)\n+-------- host A --------+ +-------- host B --------+ +-------- host C --------+\n| osd.3  osd.4  osd.5   | | osd.11 osd.12 osd.13  | | osd.20 osd.21 osd.22  |\n+-----------------------+ +-----------------------+ +-----------------------+\n MON x3 (Paxos quorum: maps)   MGR x2 (metrics, balancer)\nfull ratios per OSD: nearfull 85% -> backfillfull 90% -> full 95% = writes blocked",
  handsOn: [
    { cmd: "ceph -s && ceph health detail", what: t("Cluster status and the exact reason behind every HEALTH_WARN/ERR code.", "סטטוס ה-cluster והסיבה המדויקת מאחורי כל קוד HEALTH_WARN/ERR.") },
    { cmd: "ceph osd df tree", what: t("Per-OSD %USE and VAR grouped by host — find the one OSD that will hit full first.", "%USE ו-VAR לכל OSD, מקובצים לפי host — למצוא את ה-OSD היחיד שיגיע ראשון ל-full.") },
    { cmd: "ceph osd pool ls detail && ceph df", what: t("Pool size/min_size, EC profiles, PG counts, and STORED vs USED (raw) per pool.", "size/min_size של כל pool, פרופילי EC, מספר PGs, ו-STORED מול USED (גולמי) לכל pool.") },
    { cmd: "ceph osd set noout   # ...maintenance...   ceph osd unset noout", what: t("Reboot a storage node without triggering a full rebalance.", "לעשות reboot ל-node של אחסון בלי להפעיל rebalance מלא.") },
    { cmd: "sudo iscsiadm -m session -P 3 && sudo multipath -ll", what: t("On a SAN client: list iSCSI sessions with their disks, and confirm every LUN has two healthy paths.", "על client של SAN: לראות את ה-sessions של iSCSI עם הדיסקים שלהם, ולוודא שלכל LUN יש שני מסלולים תקינים.") }
  ],
  mnemonic: t(
    "\"Hash, PG, CRUSH, OSD\" — that's how Ceph finds data. And the full ladder: 85 warns, 90 stops healing, 95 stops writing.",
    "\"Hash, ‏PG, ‏CRUSH, ‏OSD\" — ככה Ceph מוצא נתונים. וסולם המילוי: 85 מזהיר, 90 עוצר ריפוי, 95 עוצר כתיבות."
  ),
  pitfalls: [
    t("Planning capacity on raw TB: with size=3 and headroom to survive losing a host, 'usable' is often only 20-25% of raw. Quote usable-after-failure, not raw.", "לתכנן קיבולת לפי TB גולמי: עם size=3 ומרווח כדי לשרוד אובדן host, ה'שמיש' הוא הרבה פעמים רק 20-25% מהגולמי. מצטטים שמיש-אחרי-כשל, לא גולמי."),
    t("Watching only the cluster-wide %: one imbalanced OSD hitting 95% blocks writes for every pool it serves. Watch max OSD %USE and keep the upmap balancer on.", "להסתכל רק על האחוז של כל ה-cluster: ‏OSD אחד לא מאוזן שמגיע ל-95% חוסם כתיבות לכל pool שהוא משרת. עוקבים אחרי ה-%USE המקסימלי של OSD ומשאירים את ה-upmap balancer פעיל."),
    t("Setting min_size=1 to 'keep things running' during an outage: a write acknowledged by a single OSD that then dies is lost data, and recovery from it is painful.", "להגדיר min_size=1 כדי 'שהכל ימשיך לעבוד' בזמן תקלה: כתיבה שאושרה ע\"י OSD יחיד שאחר כך מת היא נתונים שאבדו, וההתאוששות מזה כואבת."),
    t("Mounting a single iSCSI path instead of the multipath device, or running iSCSI on a shared, firewalled, 1500-MTU network — a switch reboot becomes a read-only filesystem.", "לעשות mount למסלול iSCSI בודד במקום להתקן ה-multipath, או להריץ iSCSI על רשת משותפת, עם firewall ו-MTU של 1500 — reboot של switch הופך ל-filesystem במצב read-only.")
  ],
  interview: [
    { q: t("How does a Ceph client know which OSD holds an object, and why does that matter?", "איך client של Ceph יודע איזה OSD מחזיק אובייקט, ולמה זה חשוב?"),
      a: t("It computes it: hash the object name into a PG of the pool, then run CRUSH with the current OSD map and the pool's rule to get the ordered OSD list, and send IO to the primary. There's no central metadata lookup in the data path, so there's no single bottleneck and adding OSDs scales throughput; MONs only distribute the maps.", "הוא מחשב את זה: עושה hash לשם האובייקט ל-PG בתוך ה-pool, ואז מריץ CRUSH עם ה-OSD map הנוכחי והחוק של ה-pool כדי לקבל רשימה מסודרת של OSDs, ושולח את ה-IO ל-primary. אין חיפוש metadata מרכזי בנתיב הנתונים, אז אין צוואר בקבוק יחיד, והוספת OSDs מגדילה throughput; ה-MONs רק מפיצים את המפות.") },
    { q: t("Replication or erasure coding for a 2 PB backup repository and for VM disks?", "Replication או erasure coding למאגר גיבויים של 2 PB ולדיסקים של VMs?"),
      a: t("Backups: EC (e.g. 8+3 at 1.375x vs 3x) — large sequential writes, capacity dominates, needs at least k+m (+1) failure domains. VM disks: 3x replication — small random writes, low latency, simpler recovery. Many clusters run both: an RBD replicated pool and an RGW EC data pool.", "גיבויים: EC (למשל 8+3 ב-1.375x לעומת 3x) — כתיבות סדרתיות גדולות, הקיבולת היא העיקר, וצריך לפחות k+m (+1) failure domains. דיסקים של VMs: ‏replication של 3x — כתיבות קטנות ואקראיות, latency נמוך, התאוששות פשוטה יותר. הרבה clusters מריצים את שניהם: pool של RBD עם replication ו-pool נתונים של RGW עם EC.") },
    { q: t("What's the difference between iSCSI and NFS from the server's point of view?", "מה ההבדל בין iSCSI ל-NFS מנקודת המבט של השרת?"),
      a: t("iSCSI gives the server a raw block device; the server owns the filesystem (ext4/XFS/VMFS), so only one host should mount it unless it's a cluster filesystem. NFS gives a shared filesystem owned by the NAS; many clients can read/write the same files, with locking and permissions handled by the server. Block suits databases and hypervisor datastores; file suits shared content.", "iSCSI נותן לשרת block device גולמי; השרת הוא הבעלים של ה-filesystem ‏(ext4/XFS/VMFS), אז רק host אחד אמור לעשות לו mount, אלא אם זה cluster filesystem. ‏NFS נותן filesystem משותף שה-NAS הוא הבעלים שלו; הרבה clients יכולים לקרוא ולכתוב לאותם קבצים, וה-locking וההרשאות מטופלים ע\"י השרת. Block מתאים למסדי נתונים ול-datastores של hypervisors; file מתאים לתוכן משותף.") }
  ],
  quiz: [
    { q: t("A Ceph cluster averages 72% used, but writes to one pool are blocked. Most likely cause?", "Cluster של Ceph נמצא בממוצע על 72% שימוש, אבל כתיבות ל-pool אחד חסומות. מה הסיבה הסבירה?"),
      options: [
        t("The MONs lost quorum", "ה-MONs איבדו quorum"),
        t("One OSD serving that pool crossed the 95% full ratio", "OSD אחד שמשרת את ה-pool עבר את ה-full ratio של 95%"),
        t("The pool has too many PGs", "יש ל-pool יותר מדי PGs"),
        t("Erasure coding doesn't support writes above 70%", "Erasure coding לא תומך בכתיבות מעל 70%")
      ], answer: 1,
      explain: t("Full ratios are enforced per OSD. Uneven distribution lets a single OSD hit 95% while the average looks fine. ceph osd df shows it; fix with the balancer/reweight and more capacity.", "ה-full ratios נאכפים לכל OSD בנפרד. פיזור לא אחיד מאפשר ל-OSD יחיד להגיע ל-95% בזמן שהממוצע נראה בסדר. ‏ceph osd df מראה את זה; מתקנים עם balancer/reweight ועוד קיבולת.") },
    { q: t("What is the raw-capacity overhead of an erasure-coded pool with k=4, m=2?", "מה ה-overhead על הקיבולת הגולמית של pool עם erasure coding של k=4, ‏m=2?"),
      options: [t("1.25x", "1.25x"), t("1.5x", "1.5x"), t("2x", "2x"), t("3x", "3x")], answer: 1,
      explain: t("(k+m)/k = 6/4 = 1.5x, so 67% of raw is usable, and any 2 of the 6 chunks can be lost. Replication size=3 is 3x (33% usable).", "(k+m)/k = 6/4 = 1.5x, כלומר 67% מהגולמי שמיש, ואפשר לאבד כל 2 מתוך 6 ה-chunks. ‏Replication עם size=3 זה 3x ‏(33% שמיש).") },
    { q: t("On an iSCSI client the same LUN appears as /dev/sdb and /dev/sdc. What should you mount?", "על client של iSCSI אותו LUN מופיע כ-/dev/sdb וגם כ-/dev/sdc. למה צריך לעשות mount?"),
      options: [
        t("/dev/sdb, the first path", "/dev/sdb, המסלול הראשון"),
        t("Both, as a software RAID 1", "את שניהם, כ-RAID 1 בתוכנה"),
        t("The dm-multipath device, e.g. /dev/mapper/mpatha", "את התקן ה-dm-multipath, למשל /dev/mapper/mpatha"),
        t("Whichever has the lower latency today", "את זה שיש לו latency נמוך יותר היום")
      ], answer: 2,
      explain: t("Two block devices = two paths to one LUN. dm-multipath merges them and handles failover; mounting a single path loses redundancy, and a RAID 1 across them would corrupt data (it's the same disk).", "שני block devices = שני מסלולים ל-LUN אחד. ‏dm-multipath מאחד אותם ומטפל ב-failover; mount למסלול בודד מאבד יתירות, ו-RAID 1 על שניהם ישחית נתונים (זה אותו דיסק).") },
    { q: t("You must reboot a Ceph storage node for a kernel update. What do you do first?", "אתה חייב לעשות reboot ל-node של אחסון ב-Ceph בשביל עדכון kernel. מה עושים קודם?"),
      options: [
        t("ceph osd out on all its OSDs", "ceph osd out לכל ה-OSDs שלו"),
        t("ceph osd set noout, reboot, then unset it", "ceph osd set noout, ‏reboot, ואז unset"),
        t("Raise the full ratio to 0.99", "להעלות את ה-full ratio ל-0.99"),
        t("Stop the MONs on all nodes", "לעצור את ה-MONs בכל ה-nodes")
      ], answer: 1,
      explain: t("noout stops the cluster from marking the rebooting OSDs out after 10 minutes, so it doesn't start copying terabytes elsewhere only to move them back. Marking them out triggers exactly that rebalance.", "noout מונע מה-cluster לסמן את ה-OSDs שבאמצע reboot כ-out אחרי 10 דקות, כך שהוא לא מתחיל להעתיק terabytes למקום אחר רק כדי להחזיר אותם. סימון כ-out מפעיל בדיוק את ה-rebalance הזה.") }
  ],
  related: ["raid-levels-deep", "filesystems-compared", "k8s-storage", "storage-io", "disks-hdd-ssd-nvme", "s3-deep", "linux-disks-storage", "virtualization-deep"]
});

// ======================= LESSON 3: ansible-hands-on =======================
INFRA.lessons.push({
  id: "ansible-hands-on",
  track: "cloud",
  order: 90,
  icon: "🛠️",
  level: 2,
  minutes: 15,
  title: t("Ansible Hands-On: Inventory, Playbooks, Roles, Vault", "Ansible בפועל: inventory, ‏playbooks, ‏roles ו-vault"),
  tldr: t(
    "Ansible pushes desired state to servers over plain SSH with no agent: an inventory says which hosts, a playbook says what state they should be in, modules make it so idempotently (ok vs changed), handlers restart only when something changed, and serial + max_fail_percentage roll it out safely. Terraform creates the machines, cloud-init boots them, Ansible configures what lives on them.",
    "Ansible דוחף מצב רצוי לשרתים מעל SSH רגיל בלי agent: ה-inventory אומר על אילו hosts, ה-playbook אומר באיזה מצב הם צריכים להיות, המודולים מביאים אותם לשם באופן idempotent ‏(ok מול changed), ה-handlers עושים restart רק כשמשהו השתנה, ו-serial + max_fail_percentage מגלגלים את זה בבטחה. Terraform יוצר את המכונות, cloud-init מעלה אותן, ו-Ansible מגדיר את מה שחי עליהן."
  ),
  analogy: t(
    "Ansible is a building inspector with a checklist and a master key. He doesn't move into the building (no agent); he visits over SSH, walks the checklist (playbook) room by room, and for each line asks 'is it already like this?' — if yes he ticks 'ok', if no he fixes it and writes 'changed'. If he replaced a fuse box, he flips the main breaker once at the end (handler), not after every wire. And for a 40-building complex he works through 10 buildings at a time, and stops if more than one of them catches fire (serial, max_fail_percentage).",
    "Ansible זה מפקח בנייה עם רשימת בדיקה ומפתח מאסטר. הוא לא עובר לגור בבניין (אין agent); הוא מגיע דרך SSH, עובר על הרשימה (playbook) חדר אחרי חדר, ועל כל שורה שואל 'זה כבר ככה?' — אם כן הוא מסמן 'ok', אם לא הוא מתקן וכותב 'changed'. אם הוא החליף לוח חשמל, הוא מקפיץ את המפסק הראשי פעם אחת בסוף (handler), לא אחרי כל חוט. ובמתחם של 40 בניינים הוא עובד על 10 בניינים בכל פעם, ועוצר אם יותר מאחד מהם עולה באש (serial, ‏max_fail_percentage)."
  ),
  sections: [
    {
      h: t("How it works: agentless, push, SSH, inventory", "איך זה עובד: בלי agent, ‏push, ‏SSH ו-inventory"),
      body: t(
        `<p>The <code>iac-landscape</code> lesson placed Ansible on the map (configuration management, no state file). Here's how you actually run it. A <strong>control node</strong> (your laptop, a CI runner, AWX) needs <code>ansible-core</code> (Python); targets need only <strong>SSH + Python 3</strong> (Windows targets use WinRM or SSH with PowerShell). For each task, Ansible copies a small Python module to the host, runs it, reads back JSON, and deletes it. Default parallelism is <code>forks=5</code> — raise it (<code>-f 50</code> or <code>ansible.cfg</code>) for big fleets, and enable SSH pipelining + ControlPersist for speed.</p>
${PRE_INV}
<p>Static inventory (INI or YAML) is fine for fixed fleets. In the cloud, use <strong>dynamic inventory plugins</strong> — <code>amazon.aws.aws_ec2</code>, <code>azure.azcollection.azure_rm</code> (file must end in <code>azure_rm.yml</code>), <code>google.cloud.gcp_compute</code> — which query the API at run time and build groups from tags, so a new instance tagged <code>role=web</code> is configured on the next run without anyone editing a file. Per-group and per-host variables live next to the inventory in <code>group_vars/</code> and <code>host_vars/</code>.</p>
<p><strong>Ad-hoc commands</strong> are one-off module calls — great for checks and emergencies:</p>
${PRE_ADHOC}`,
        `<p>השיעור <code>iac-landscape</code> מיקם את Ansible על המפה (configuration management, בלי state file). כאן נראה איך מריצים אותו בפועל. ‏<strong>Control node</strong> (הלפטופ שלך, runner של CI, ‏AWX) צריך <code>ansible-core</code> ‏(Python); ה-targets צריכים רק <strong>SSH + Python 3</strong> ‏(targets של Windows משתמשים ב-WinRM או ב-SSH עם PowerShell). לכל task, ‏Ansible מעתיק מודול Python קטן ל-host, מריץ אותו, קורא JSON בחזרה ומוחק אותו. ברירת המחדל של מקביליות היא <code>forks=5</code> — תעלה אותה (<code>-f 50</code> או ב-<code>ansible.cfg</code>) לצי גדול, ותפעיל SSH pipelining ו-ControlPersist בשביל מהירות.</p>
${PRE_INV}
<p>Inventory סטטי (INI או YAML) מספיק לצי קבוע. בענן משתמשים ב-<strong>dynamic inventory plugins</strong> — <code>amazon.aws.aws_ec2</code>, <code>azure.azcollection.azure_rm</code> (שם הקובץ חייב להסתיים ב-<code>azure_rm.yml</code>), <code>google.cloud.gcp_compute</code> — שפונים ל-API בזמן ריצה ובונים groups לפי tags, כך ש-instance חדש עם tag של <code>role=web</code> מוגדר בריצה הבאה בלי שמישהו יערוך קובץ. משתנים לכל group ולכל host יושבים ליד ה-inventory ב-<code>group_vars/</code> וב-<code>host_vars/</code>.</p>
<p><strong>פקודות ad-hoc</strong> הן קריאות חד-פעמיות למודול — מעולות לבדיקות ולמקרי חירום:</p>
${PRE_ADHOC}`
      )
    },
    {
      h: t("A full playbook: nginx + template + handler + rolling update", "Playbook מלא: nginx + template + handler + rolling update"),
      body: t(
        `<p>A <strong>playbook</strong> is a list of <strong>plays</strong>; each play maps a host pattern to an ordered list of <strong>tasks</strong>; each task calls one <strong>module</strong> with arguments. <strong>Handlers</strong> are tasks that run only when notified, once, at the end of the play (or at <code>meta: flush_handlers</code>).</p>
${PRE_PLAYBOOK}
<p>What makes this production-grade: the <code>template</code> module renders <strong>Jinja2</strong> (variables, loops over inventory groups, <code>hostvars</code> of other hosts) and compares the result to the file on disk — it only writes, and only notifies the handler, if the content differs. <code>validate</code> runs <code>nginx -t</code> on the temp file before it replaces the real one. <code>reloaded</code> instead of <code>restarted</code> keeps connections alive.</p>
<p><strong>Rolling updates</strong>: <code>serial</code> splits the hosts into batches (a number, a percentage, or a ramp like <code>[1, 5, "25%"]</code> — canary first). <code>max_fail_percentage</code> aborts the remaining batches when more than that share of the current batch fails (note: it's "greater than", so with 4 hosts per batch and 25%, one failure doesn't abort but two do). Combine with <code>pre_tasks</code>/<code>post_tasks</code> that take each host out of the load balancer (<code>delegate_to</code> the LB or a cloud API module) and wait for a health check before returning it. <code>any_errors_fatal: true</code> stops everything on the first failure, for changes where partial rollout is worse than none.</p>
<blockquote>💡 Real world: <code>serial: [1, "10%", "50%"]</code> plus a <code>uri</code> health-check task with <code>retries: 10, delay: 6, until: result.status == 200</code> is a complete canary deploy for a VM fleet — no extra tooling.</blockquote>`,
        `<p><strong>Playbook</strong> הוא רשימה של <strong>plays</strong>; כל play ממפה תבנית של hosts לרשימה מסודרת של <strong>tasks</strong>; כל task קורא ל-<strong>module</strong> אחד עם ארגומנטים. ‏<strong>Handlers</strong> הם tasks שרצים רק כשמישהו עשה להם notify, פעם אחת, בסוף ה-play (או ב-<code>meta: flush_handlers</code>).</p>
${PRE_PLAYBOOK}
<p>מה הופך את זה לרמת פרודקשן: המודול <code>template</code> מרנדר <strong>Jinja2</strong> (משתנים, לולאות על groups מה-inventory, ‏<code>hostvars</code> של hosts אחרים) ומשווה את התוצאה לקובץ על הדיסק — הוא כותב, ועושה notify ל-handler, רק אם התוכן שונה. ‏<code>validate</code> מריץ <code>nginx -t</code> על הקובץ הזמני לפני שהוא מחליף את האמיתי. ‏<code>reloaded</code> במקום <code>restarted</code> שומר על ה-connections.</p>
<p><strong>Rolling updates</strong>: ‏<code>serial</code> מחלק את ה-hosts ל-batches (מספר, אחוז, או הדרגה כמו <code>[1, 5, "25%"]</code> — קודם canary). ‏<code>max_fail_percentage</code> מבטל את ה-batches שנשארו כשיותר מהחלק הזה של ה-batch הנוכחי נכשל (שים לב: זה "יותר מ", כך שעם 4 hosts ב-batch ו-25%, כישלון אחד לא עוצר אבל שניים כן). משלבים עם <code>pre_tasks</code>/<code>post_tasks</code> שמוציאים כל host מה-load balancer (<code>delegate_to</code> ל-LB או מודול של API בענן) ומחכים ל-health check לפני שמחזירים אותו. ‏<code>any_errors_fatal: true</code> עוצר הכל בכישלון הראשון, לשינויים שבהם rollout חלקי גרוע יותר מכלום.</p>
<blockquote>💡 מהשטח: <code>serial: [1, "10%", "50%"]</code> יחד עם task של <code>uri</code> ל-health check עם <code>retries: 10, delay: 6, until: result.status == 200</code> זה canary deploy שלם לצי של VMs — בלי שום כלי נוסף.</blockquote>`
      )
    },
    {
      h: t("Idempotence: ok vs changed, and why command/shell is a smell", "Idempotence: ‏ok מול changed, ולמה command/shell זה ריח רע"),
      body: t(
        `<p>Idempotent = running it twice leaves the same result as running it once, and the second run reports <code>changed=0</code>. That's what makes a playbook safe to run every hour from CI to correct drift. Modules like <code>apt</code>, <code>copy</code>, <code>template</code>, <code>lineinfile</code>, <code>user</code>, <code>service</code>, <code>systemd</code> check current state first. <code>command</code>/<code>shell</code> don't know what your command does, so they always report <code>changed</code> and are skipped in check mode.</p>
${PRE_IDEMP}
<table><tr><th>Status</th><th>Meaning</th></tr>
<tr><td><code>ok</code></td><td>Already in desired state, nothing done</td></tr>
<tr><td><code>changed</code></td><td>Ansible modified the host (and notified handlers)</td></tr>
<tr><td><code>skipped</code></td><td><code>when:</code> was false, or check mode on an unsupported module</td></tr>
<tr><td><code>failed</code> / <code>unreachable</code></td><td>Task error / SSH or auth failed — the host is dropped from the rest of the play</td></tr>
<tr><td><code>rescued</code> / <code>ignored</code></td><td>Handled by a <code>block/rescue</code> / <code>ignore_errors: true</code></td></tr></table>
<p><strong>Variables & precedence (briefly)</strong>: there are 22 levels; the ones you'll actually meet, low → high: role <code>defaults/</code> → inventory vars → <code>group_vars/all</code> → <code>group_vars/&lt;group&gt;</code> → <code>host_vars/&lt;host&gt;</code> → play <code>vars</code> → role <code>vars/</code> → <code>set_fact</code>/<code>register</code> → <strong>extra vars (<code>-e</code>) always win</strong>. Rule of thumb: put tunables in role defaults, environment differences in group_vars, and avoid role <code>vars/</code> for anything a user should override. <code>ansible-inventory --host web01</code> shows the merged result.</p>`,
        `<p>Idempotent = להריץ פעמיים משאיר את אותה תוצאה כמו להריץ פעם אחת, והריצה השנייה מדווחת <code>changed=0</code>. זה מה שהופך playbook לבטוח להרצה כל שעה מ-CI כדי לתקן drift. מודולים כמו <code>apt</code>, <code>copy</code>, <code>template</code>, <code>lineinfile</code>, <code>user</code>, <code>service</code>, <code>systemd</code> בודקים קודם את המצב הנוכחי. ‏<code>command</code>/<code>shell</code> לא יודעים מה הפקודה שלך עושה, אז הם תמיד מדווחים <code>changed</code> ומדולגים ב-check mode.</p>
${PRE_IDEMP}
<table><tr><th>סטטוס</th><th>משמעות</th></tr>
<tr><td><code>ok</code></td><td>כבר במצב הרצוי, לא נעשה כלום</td></tr>
<tr><td><code>changed</code></td><td>Ansible שינה את ה-host (ועשה notify ל-handlers)</td></tr>
<tr><td><code>skipped</code></td><td>ה-<code>when:</code> היה false, או check mode על מודול שלא תומך בו</td></tr>
<tr><td><code>failed</code> / <code>unreachable</code></td><td>שגיאה ב-task / כישלון SSH או אימות — ה-host יוצא משאר ה-play</td></tr>
<tr><td><code>rescued</code> / <code>ignored</code></td><td>טופל ע"י <code>block/rescue</code> / <code>ignore_errors: true</code></td></tr></table>
<p><strong>משתנים וקדימות (בקצרה)</strong>: יש 22 רמות; אלה שבאמת תפגוש, מנמוך לגבוה: ה-<code>defaults/</code> של role ← משתני inventory ← <code>group_vars/all</code> ← <code>group_vars/&lt;group&gt;</code> ← <code>host_vars/&lt;host&gt;</code> ← <code>vars</code> של play ← ה-<code>vars/</code> של role ← <code>set_fact</code>/<code>register</code> ← <strong>extra vars ‏(<code>-e</code>) תמיד מנצחים</strong>. כלל אצבע: פרמטרים שמכווננים ב-defaults של ה-role, הבדלים בין סביבות ב-group_vars, ולהימנע מ-<code>vars/</code> של role לכל דבר שמשתמש אמור לדרוס. ‏<code>ansible-inventory --host web01</code> מראה את התוצאה הממוזגת.</p>`
      )
    },
    {
      h: t("Roles, collections, vault, check mode, Molecule, AWX", "Roles, ‏collections, ‏vault, ‏check mode, ‏Molecule ו-AWX"),
      body: t(
        `<p><strong>Roles</strong> package tasks, handlers, templates, files and defaults into a reusable unit with a fixed layout. <strong>Collections</strong> are the distribution format for modules, plugins and roles, namespaced (<code>amazon.aws</code>, <code>community.general</code>, <code>kubernetes.core</code>) — always call modules by FQCN (<code>ansible.builtin.copy</code>). <strong>Ansible Galaxy</strong> (and Automation Hub for certified content) is where they're published; pin versions in <code>requirements.yml</code>.</p>
${PRE_ROLE}
<p><strong>Secrets</strong>: <code>ansible-vault</code> encrypts whole files or single values with AES-256; decrypt at run time with a password file, a prompt, or a vault-ID per environment. In bigger setups, look secrets up at run time instead (<code>community.hashi_vault</code>, <code>amazon.aws.aws_secret</code> lookups) so nothing sensitive is in git at all. Mark tasks that print secrets with <code>no_log: true</code>.</p>
${PRE_VAULT}
<p><strong>Testing</strong>: <code>ansible-lint</code> in CI catches bad practice (shell instead of modules, missing FQCN, missing <code>changed_when</code>). <strong>Molecule</strong> spins up throwaway containers/VMs (Docker/Podman/EC2 drivers), runs your role (<code>converge</code>), runs it <em>again</em> and fails if anything reports changed (<code>idempotence</code>), then runs assertions (<code>verify</code>) and destroys everything.</p>
<p><strong>AWX / Red Hat Ansible Automation Platform</strong>: a web UI + API around ansible-playbook — job templates, credentials stored encrypted (users run jobs without seeing SSH keys), RBAC, schedules, surveys, inventories synced from clouds, logs of every run, and Execution Environments (container images with pinned ansible-core + collections). AWX is the open-source upstream; its standalone release cadence paused in 2024 while it's being re-architected, so many teams run AAP (paid) or simply run playbooks from CI pipelines.</p>
<table><tr><th>Tool</th><th>Owns</th><th>When it runs</th><th>State</th></tr>
<tr><td><strong>Terraform/OpenTofu</strong></td><td>Cloud resources: VPC, VMs, LBs, DNS, IAM, managed DBs</td><td>On change (plan/apply)</td><td>State file; knows what to delete</td></tr>
<tr><td><strong>cloud-init</strong></td><td>First boot of one instance: users, SSH keys, packages, write files, run a bootstrap</td><td>Once, at boot, on the machine itself</td><td>None (per-instance)</td></tr>
<tr><td><strong>Ansible</strong></td><td>What runs on existing hosts: packages, config files, services, users, OS hardening, app deploys, network devices</td><td>On demand / scheduled, pushed over SSH</td><td>None; the host is the state</td></tr>
<tr><td>Packer (+ Ansible)</td><td>Golden images with everything baked in</td><td>At image build time</td><td>The image</td></tr></table>
<blockquote>⚠️ Production tip: if you can, bake with Packer + Ansible and boot with cloud-init (immutable), and keep live Ansible runs for what truly changes in place — on-prem fleets, network gear, databases, and drift correction. Running a 40-minute playbook during an autoscaling event is how scale-ups fail.</blockquote>`,
        `<p><strong>Roles</strong> אורזים tasks, ‏handlers, ‏templates, קבצים ו-defaults ליחידה לשימוש חוזר עם מבנה קבוע. ‏<strong>Collections</strong> הם פורמט ההפצה של מודולים, plugins ו-roles, עם namespace ‏(<code>amazon.aws</code>, <code>community.general</code>, <code>kubernetes.core</code>) — תמיד קוראים למודולים לפי FQCN ‏(<code>ansible.builtin.copy</code>). ‏<strong>Ansible Galaxy</strong> (ו-Automation Hub לתוכן מאושר) זה המקום שבו הם מתפרסמים; מקבעים גרסאות ב-<code>requirements.yml</code>.</p>
${PRE_ROLE}
<p><strong>סודות</strong>: <code>ansible-vault</code> מצפין קבצים שלמים או ערכים בודדים עם AES-256; מפענחים בזמן ריצה עם קובץ סיסמה, prompt, או vault-ID לכל סביבה. בהקמות גדולות יותר עדיף לשלוף סודות בזמן ריצה (lookups של <code>community.hashi_vault</code> או <code>amazon.aws.aws_secret</code>) כך ששום דבר רגיש לא נמצא ב-git בכלל. מסמנים tasks שמדפיסים סודות עם <code>no_log: true</code>.</p>
${PRE_VAULT}
<p><strong>בדיקות</strong>: <code>ansible-lint</code> ב-CI תופס הרגלים רעים (shell במקום מודולים, חוסר ב-FQCN, חוסר ב-<code>changed_when</code>). ‏<strong>Molecule</strong> מרים containers או VMs זמניים (drivers של Docker/Podman/EC2), מריץ את ה-role שלך (<code>converge</code>), מריץ אותו <em>שוב</em> ונכשל אם משהו מדווח changed ‏(<code>idempotence</code>), ואז מריץ assertions ‏(<code>verify</code>) ומוחק הכל.</p>
<p><strong>AWX / Red Hat Ansible Automation Platform</strong>: ‏web UI ו-API סביב ansible-playbook — job templates, ‏credentials שמאוחסנים מוצפנים (משתמשים מריצים jobs בלי לראות מפתחות SSH), ‏RBAC, תזמונים, surveys, ‏inventories שמסונכרנים מהענן, לוג של כל ריצה, ו-Execution Environments ‏(container images עם ansible-core ו-collections בגרסאות מקובעות). ‏AWX הוא ה-upstream בקוד פתוח; קצב השחרורים העצמאי שלו נעצר ב-2024 בזמן שהוא נבנה מחדש, ולכן הרבה צוותים מריצים AAP (בתשלום) או פשוט מריצים playbooks מתוך pipelines של CI.</p>
<table><tr><th>כלי</th><th>אחראי על</th><th>מתי רץ</th><th>State</th></tr>
<tr><td><strong>Terraform/OpenTofu</strong></td><td>משאבי ענן: VPC, ‏VMs, ‏LBs, ‏DNS, ‏IAM, מסדי נתונים מנוהלים</td><td>כשיש שינוי (plan/apply)</td><td>State file; יודע מה למחוק</td></tr>
<tr><td><strong>cloud-init</strong></td><td>ה-boot הראשון של instance: משתמשים, מפתחות SSH, חבילות, כתיבת קבצים, הרצת bootstrap</td><td>פעם אחת, ב-boot, על המכונה עצמה</td><td>אין (לכל instance)</td></tr>
<tr><td><strong>Ansible</strong></td><td>מה שרץ על hosts קיימים: חבילות, קבצי config, שירותים, משתמשים, הקשחת OS, ‏deploy של אפליקציות, רכיבי רשת</td><td>לפי דרישה או מתוזמן, ב-push מעל SSH</td><td>אין; ה-host הוא ה-state</td></tr>
<tr><td>Packer (+ Ansible)</td><td>Golden images שהכל אפוי בתוכם</td><td>בזמן בניית ה-image</td><td>ה-image</td></tr></table>
<blockquote>⚠️ טיפ לפרודקשן: אם אפשר, אופים עם Packer + Ansible ומעלים עם cloud-init (immutable), ומשאירים ריצות חיות של Ansible למה שבאמת משתנה במקום — צי on-prem, רכיבי רשת, מסדי נתונים ותיקון drift. להריץ playbook של 40 דקות באמצע אירוע autoscaling זה בדיוק איך scale-ups נכשלים.</blockquote>`
      )
    }
  ],
  diagram: "control node (laptop / CI / AWX)\n  ansible-playbook -i inventory site.yml\n     | SSH (forks=N in parallel), copy module -> run -> JSON back\n     v\n [web01] [web02] [web03] [web04]   serial: 25% -> one batch at a time\n   task: apt nginx        -> ok / changed\n   task: template conf    -> changed -> notify handler\n   handler: reload nginx  (once, end of play)\nTerraform = creates hosts | cloud-init = first boot | Ansible = config on hosts",
  handsOn: [
    { cmd: "ansible all -i inventory/prod.ini -m ansible.builtin.ping -f 20", what: t("Check SSH + Python connectivity to every host in parallel.", "לבדוק חיבור SSH ו-Python לכל ה-hosts במקביל.") },
    { cmd: "ansible-inventory -i inventory/aws_ec2.yml --graph && ansible-inventory -i inventory/prod.ini --host web01", what: t("See the groups a dynamic inventory builds and the merged variables of one host.", "לראות את ה-groups ש-dynamic inventory בונה ואת המשתנים הממוזגים של host אחד.") },
    { cmd: "ansible-playbook -i inventory/prod.ini site.yml --check --diff --limit web01", what: t("Dry-run against one host and see the exact file diffs before touching anything.", "להריץ dry-run על host אחד ולראות את ה-diffs המדויקים בקבצים לפני שנוגעים במשהו.") },
    { cmd: "ansible-playbook -i inventory/prod.ini site.yml && ansible-playbook -i inventory/prod.ini site.yml | tail -4", what: t("Run twice: the second PLAY RECAP should show changed=0 — your idempotence test.", "להריץ פעמיים: ב-PLAY RECAP השני צריך להופיע changed=0 — זו בדיקת ה-idempotence שלך.") },
    { cmd: "ansible-vault encrypt_string 'S3cr3t!' --name db_password", what: t("Encrypt one secret inline for a vars file.", "להצפין סוד בודד inline בשביל קובץ vars.") }
  ],
  mnemonic: t(
    "\"SSH, state, second run\": agentless over SSH, describe state not steps, and the second run must say changed=0.",
    "\"SSH, ‏state, ריצה שנייה\": בלי agent מעל SSH, מתארים מצב ולא צעדים, והריצה השנייה חייבת להגיד changed=0."
  ),
  pitfalls: [
    t("Writing playbooks as shell scripts in YAML (command/shell everywhere): always 'changed', no check mode, handlers fire every run, and drift correction becomes impossible.", "לכתוב playbooks כסקריפטי shell בתוך YAML ‏(command/shell בכל מקום): תמיד 'changed', אין check mode, ה-handlers רצים בכל ריצה, ותיקון drift נהיה בלתי אפשרי."),
    t("Running against the whole fleet with no serial: one bad template restarts nginx on every host at once. Use serial, max_fail_percentage and validate.", "להריץ על כל הצי בלי serial: ‏template אחד שבור עושה restart ל-nginx על כל ה-hosts בבת אחת. משתמשים ב-serial, ‏max_fail_percentage ו-validate."),
    t("Using Ansible to create and delete cloud infrastructure at scale: no state means removed tasks don't delete resources — that's Terraform's job.", "להשתמש ב-Ansible כדי ליצור ולמחוק תשתית ענן בסקייל: בלי state, הסרה של tasks לא מוחקת משאבים — זה התפקיד של Terraform."),
    t("Committing secrets in plain group_vars, or printing them in logs: use ansible-vault or a secrets lookup, and no_log: true on sensitive tasks.", "לעשות commit לסודות בתוך group_vars גלויים, או להדפיס אותם ללוגים: משתמשים ב-ansible-vault או ב-lookup של סודות, ו-no_log: true על tasks רגישים.")
  ],
  interview: [
    { q: t("What does idempotent mean in Ansible and how do you enforce it?", "מה זה idempotent ב-Ansible ואיך אוכפים את זה?"),
      a: t("Running the playbook again on a converged host changes nothing and reports changed=0. Use state-aware modules (package, template, lineinfile, service) instead of command/shell; when you must use command, add creates/removes or changed_when/failed_when; trigger restarts via handlers. Enforce it in CI with Molecule's idempotence step (second converge must report no changes).", "להריץ את ה-playbook שוב על host שכבר במצב הרצוי לא משנה כלום ומדווח changed=0. משתמשים במודולים שמכירים state ‏(package, ‏template, ‏lineinfile, ‏service) במקום command/shell; כשחייבים command, מוסיפים creates/removes או changed_when/failed_when; ועושים restart דרך handlers. אוכפים ב-CI עם שלב ה-idempotence של Molecule (ה-converge השני חייב לדווח שאין שינויים).") },
    { q: t("How would you roll a config change to 200 web servers safely with Ansible?", "איך היית מגלגל שינוי config ל-200 שרתי web בבטחה עם Ansible?"),
      a: t("Lint + Molecule in CI, then --check --diff on a sample host. In the play: serial: [1, '10%', '25%'] for a canary ramp, max_fail_percentage to abort on failures, template with validate, handler doing reload, pre_tasks to drain the host from the LB and post_tasks with a uri health check (retries/until) before re-adding it. Run from AWX/CI so it's logged and repeatable.", "Lint ו-Molecule ב-CI, ואז --check --diff על host לדוגמה. ב-play: ‏serial: [1, '10%', '25%'] להדרגת canary, ‏max_fail_percentage כדי לעצור על כישלונות, template עם validate, ‏handler שעושה reload, ‏pre_tasks שמוציאים את ה-host מה-LB ו-post_tasks עם health check של uri ‏(retries/until) לפני שמחזירים אותו. מריצים מ-AWX או מ-CI כדי שזה יהיה מתועד ושחזור.") },
    { q: t("Terraform, cloud-init and Ansible — who does what?", "Terraform, ‏cloud-init ו-Ansible — מי עושה מה?"),
      a: t("Terraform provisions and tracks cloud resources with state (and deletes what you remove). cloud-init runs once on first boot inside the instance for bootstrap (users, keys, packages, register with config management). Ansible configures software on existing hosts repeatedly over SSH, and often bakes golden images with Packer. Overlap exists, but using each for its strength avoids stateless infra and slow boots.", "Terraform מקים ועוקב אחרי משאבי ענן עם state (ומוחק את מה שהסרת). ‏cloud-init רץ פעם אחת ב-boot הראשון בתוך ה-instance בשביל bootstrap (משתמשים, מפתחות, חבילות, רישום ל-configuration management). ‏Ansible מגדיר תוכנה על hosts קיימים שוב ושוב מעל SSH, והרבה פעמים אופה golden images עם Packer. יש חפיפה, אבל להשתמש בכל אחד לפי החוזקה שלו חוסך תשתית בלי state ו-boots איטיים.") }
  ],
  quiz: [
    { q: t("A task uses ansible.builtin.shell to append a line to a file. What happens on the second run?", "Task משתמש ב-ansible.builtin.shell כדי להוסיף שורה לקובץ. מה קורה בריצה השנייה?"),
      options: [
        t("Ansible detects the line exists and reports ok", "Ansible מזהה שהשורה קיימת ומדווח ok"),
        t("The line is appended again and the task reports changed", "השורה מתווספת שוב וה-task מדווח changed"),
        t("The task is skipped automatically", "ה-task מדולג אוטומטית"),
        t("Ansible fails because shell is deprecated", "Ansible נכשל כי shell הוא deprecated")
      ], answer: 1,
      explain: t("shell/command have no idea what the command does, so they run every time and report changed — here creating a duplicate line. lineinfile is the idempotent module for this.", "ל-shell/command אין מושג מה הפקודה עושה, אז הם רצים כל פעם ומדווחים changed — כאן זה יוצר שורה כפולה. ‏lineinfile הוא המודול ה-idempotent לזה.") },
    { q: t("When does a handler notified by three different tasks run?", "מתי רץ handler שקיבל notify משלושה tasks שונים?"),
      options: [
        t("Three times, right after each notifying task", "שלוש פעמים, מיד אחרי כל task שעשה notify"),
        t("Once, at the end of the play (or at flush_handlers), and only if at least one of them reported changed", "פעם אחת, בסוף ה-play (או ב-flush_handlers), ורק אם לפחות אחד מהם דיווח changed"),
        t("Every run, regardless of changes", "בכל ריצה, בלי קשר לשינויים"),
        t("Only in check mode", "רק ב-check mode")
      ], answer: 1,
      explain: t("Handlers are de-duplicated and deferred: they run once per play at the end, triggered only by tasks that actually changed something.", "Handlers עוברים de-dup ונדחים: הם רצים פעם אחת לכל play בסוף, ורק אם tasks באמת שינו משהו.") },
    { q: t("Which variable source has the highest precedence?", "לאיזה מקור משתנים יש את הקדימות הגבוהה ביותר?"),
      options: [
        t("Role defaults/main.yml", "defaults/main.yml של role"),
        t("host_vars/web01.yml", "host_vars/web01.yml"),
        t("Play vars:", "vars: של ה-play"),
        t("Extra vars passed with -e", "Extra vars שמועברים עם -e")
      ], answer: 3,
      explain: t("Extra vars (-e) always win. Role defaults are the lowest, designed to be overridden by inventory/group_vars/host_vars.", "Extra vars ‏(-e) תמיד מנצחים. ה-defaults של role הם הנמוכים ביותר, ותוכננו כדי שידרסו אותם ע\"י inventory/group_vars/host_vars.") },
    { q: t("You need to create a VPC, subnets and 20 EC2 instances, then install and configure nginx on them. Best split?", "צריך ליצור VPC, ‏subnets ו-20 instances של EC2, ואז להתקין ולהגדיר עליהם nginx. מה החלוקה הנכונה?"),
      options: [
        t("Ansible for everything", "Ansible להכל"),
        t("cloud-init for the VPC, Terraform for nginx", "cloud-init ל-VPC, ‏Terraform ל-nginx"),
        t("Terraform for VPC/subnets/instances, Ansible (or a baked image + cloud-init) for nginx config", "Terraform ל-VPC/subnets/instances, ‏Ansible (או image אפוי + cloud-init) להגדרת nginx"),
        t("Molecule for the infrastructure, AWX for the instances", "Molecule לתשתית, ‏AWX ל-instances")
      ], answer: 2,
      explain: t("Terraform holds state for cloud resources (and can delete them); Ansible or an image-bake pipeline handles what runs on the hosts. cloud-init only runs inside an instance at boot.", "Terraform מחזיק state למשאבי ענן (ויכול למחוק אותם); ‏Ansible או pipeline של אפיית image מטפלים במה שרץ על ה-hosts. ‏cloud-init רץ רק בתוך instance ב-boot.") }
  ],
  related: ["iac-landscape", "cloud-iac", "linux-ssh-remote", "staff-terraform-at-scale", "release-engineering", "linux-systemd-logs"]
});

// ======================= GLOSSARY =======================
INFRA.glossary.push(
  { term: "KVM", track: "foundations", lesson: "virtualization-deep",
    def: t("Kernel-based Virtual Machine: Linux kernel module (since 2.6.20) that uses VT-x/AMD-V to turn Linux into a Type 1 hypervisor; QEMU provides the devices, libvirt the management. Basis of AWS Nitro, GCP, Proxmox, OpenStack.", "Kernel-based Virtual Machine: מודול של ה-kernel של Linux (מאז 2.6.20) שמשתמש ב-VT-x/AMD-V כדי להפוך את Linux ל-hypervisor מסוג 1; ‏QEMU מספק את ההתקנים ו-libvirt את הניהול. הבסיס של AWS Nitro, ‏GCP, ‏Proxmox ו-OpenStack.") },
  { term: "Live migration", track: "foundations", lesson: "virtualization-deep",
    def: t("Moving a running VM between hosts without a reboot (KVM, vMotion): pre-copy RAM, resend dirty pages until the rest fits a ~100-300 ms pause, then resume on the target. Needs shared storage or a storage copy.", "העברה של VM רצה בין hosts בלי reboot ‏(KVM, ‏vMotion): העתקה מוקדמת של ה-RAM, שליחה חוזרת של דפים מלוכלכים עד שהשארית נכנסת בעצירה של בערך 100-300 ms, ואז המשך ביעד. צריך storage משותף או העתקת storage.") },
  { term: "Memory ballooning", track: "foundations", lesson: "virtualization-deep",
    def: t("A driver inside the guest (virtio-balloon, VMware vmmemctl) allocates memory on the hypervisor's request and hands those pages back to the host, enabling memory overcommit at the cost of guest swapping or OOM.", "דרייבר בתוך ה-guest ‏(virtio-balloon, ‏vmmemctl של VMware) מקצה זיכרון לפי בקשת ה-hypervisor ומחזיר את הדפים ל-host, וכך מאפשר memory overcommit במחיר של swap או OOM בתוך ה-guest.") },
  { term: "Ceph", track: "foundations", lesson: "distributed-storage-ceph",
    def: t("Open-source distributed storage on commodity servers: RADOS objects placed by CRUSH across OSDs (replicated or erasure-coded), exposed as block (RBD), file (CephFS) and S3 (RGW). Runs on Kubernetes via Rook.", "אחסון מבוזר בקוד פתוח על שרתים רגילים: אובייקטים של RADOS ש-CRUSH ממקם על פני OSDs ‏(replication או erasure coding), נחשפים כ-block ‏(RBD), ‏file ‏(CephFS) ו-S3 ‏(RGW). רץ על Kubernetes דרך Rook.") },
  { term: "iSCSI", track: "foundations", lesson: "distributed-storage-ceph",
    def: t("SCSI block commands over TCP (port 3260): an initiator logs in to a target and sees its LUNs as local disks. Name format IQN; secure with CHAP + ACLs; always pair with multipath.", "פקודות block של SCSI מעל TCP (פורט 3260): ‏initiator מתחבר ל-target ורואה את ה-LUNs שלו כדיסקים מקומיים. פורמט שמות IQN; מאבטחים עם CHAP ו-ACLs; תמיד בשילוב עם multipath.") },
  { term: "Erasure coding", track: "foundations", lesson: "distributed-storage-ceph",
    def: t("Splitting data into k data chunks + m parity chunks so any m can be lost: k=4,m=2 costs 1.5x raw vs 3x for triple replication, but uses more CPU and has slower small writes. Used in Ceph, MinIO, S3.", "חלוקת נתונים ל-k chunks של נתונים ועוד m chunks של parity, כך שאפשר לאבד כל m מהם: ‏k=4,m=2 עולה 1.5x מהגולמי לעומת 3x ב-replication משולש, אבל דורש יותר CPU והכתיבות הקטנות איטיות יותר. בשימוש ב-Ceph, ‏MinIO ו-S3.") },
  { term: "Ansible", track: "cloud", lesson: "ansible-hands-on",
    def: t("Agentless configuration management: pushes idempotent modules over SSH (WinRM for Windows) to hosts listed in an inventory, driven by YAML playbooks and roles. No state file; the hosts are the state.", "Configuration management בלי agent: דוחף מודולים idempotent מעל SSH ‏(WinRM ל-Windows) ל-hosts שמופיעים ב-inventory, לפי playbooks ו-roles ב-YAML. אין state file; ה-hosts הם ה-state.") },
  { term: "Playbook", track: "cloud", lesson: "ansible-hands-on",
    def: t("An Ansible YAML file of plays; each play maps a host pattern to ordered tasks (module calls) plus handlers, with options like become, serial and max_fail_percentage.", "קובץ YAML של Ansible שמכיל plays; כל play ממפה תבנית של hosts ל-tasks מסודרים (קריאות למודולים) ול-handlers, עם אפשרויות כמו become, ‏serial ו-max_fail_percentage.") },
  { term: "Ansible Vault", track: "cloud", lesson: "ansible-hands-on",
    def: t("Built-in AES-256 encryption for Ansible files or single variables (ansible-vault create/encrypt_string), decrypted at run time with a password file, prompt or vault ID.", "הצפנת AES-256 מובנית לקבצים או למשתנים בודדים של Ansible ‏(ansible-vault create/encrypt_string), שמפוענחת בזמן ריצה עם קובץ סיסמה, prompt או vault ID.") }
);

// ======================= SCENARIO =======================
INFRA.scenarios.push({
  id: "ceph-osd-nearfull",
  icon: "🗄️",
  title: t("Ceph Nearfull After an OSD Failure", "Ceph ב-nearfull אחרי נפילת OSD"),
  start: "s1",
  steps: {
    s1: {
      text: t(
        "07:40. Overnight, osd.16 on node3 died (disk failure). Ten minutes later Ceph marked it out and started backfilling its data onto the remaining OSDs. Now the alert channel shows HEALTH_WARN with nearfull and backfillfull OSDs. This cluster backs the RBD disks of ~300 production VMs. What's your first move?",
        "07:40. בלילה osd.16 על node3 מת (כשל דיסק). עשר דקות אחר כך Ceph סימן אותו out והתחיל לעשות backfill לנתונים שלו על שאר ה-OSDs. עכשיו בערוץ ה-alerts יש HEALTH_WARN עם OSDs במצב nearfull ו-backfillfull. ה-cluster הזה מחזיק את דיסקי ה-RBD של בערך 300 VMs בפרודקשן. מה הצעד הראשון שלך?"
      ),
      data: `$ ceph -s
  cluster:
    health: HEALTH_WARN
            3 nearfull osd(s)
            1 backfillfull osd(s)
            Low space hindering backfill (add storage if this doesn't resolve itself): 9 pgs backfill_toofull
            Degraded data redundancy: 61210/3412233 objects degraded (1.794%), 22 pgs degraded
  services:
    osd: 24 osds: 23 up (since 7h), 23 in (since 7h)
  data:
    usage:   34.6 TiB used, 7.2 TiB / 41.8 TiB avail
    pgs:     22 active+undersized+degraded+remapped+backfill_wait
             9  active+undersized+degraded+remapped+backfill_toofull`,
      choices: [
        { label: t("Look at the per-OSD distribution with ceph osd df tree before changing anything.", "להסתכל על הפיזור לכל OSD עם ceph osd df tree לפני שמשנים משהו."), next: "s2", score: 10,
          feedback: t("Right. Full ratios are enforced per OSD; you need to know which OSD is closest to 95% and why.", "נכון. ה-full ratios נאכפים לכל OSD; אתה צריך לדעת איזה OSD הכי קרוב ל-95% ולמה.") },
        { label: t("Raise the full ratio to 0.99 right away so writes can never block.", "להעלות מיד את ה-full ratio ל-0.99 כדי שכתיבות אף פעם לא ייחסמו."), next: "s2", score: 0,
          feedback: t("Dangerous. The ratios are the margin that keeps BlueStore from running out of space, which can crash OSDs and make them hard to start again. Raising full to 0.99 removes the guard rail instead of fixing the problem.", "מסוכן. ה-ratios הם המרווח ששומר על BlueStore מלהישאר בלי מקום, מה שיכול להפיל OSDs ולהקשות מאוד על העלאה שלהם מחדש. להעלות את full ל-0.99 מוריד את מעקה הבטיחות במקום לתקן את הבעיה.") },
        { label: t("Restart all OSDs on all nodes to clear the stuck PGs.", "לעשות restart לכל ה-OSDs בכל ה-nodes כדי לשחרר את ה-PGs התקועים."), next: "lose", score: 0,
          feedback: t("Restarting every OSD at once makes all PGs re-peer, adds more degraded PGs, and fixes nothing about capacity.", "Restart לכל ה-OSDs בבת אחת גורם לכל ה-PGs לעשות peering מחדש, מוסיף עוד PGs במצב degraded, ולא פותר שום דבר בקיבולת.") }
      ]
    },
    s2: {
      text: t(
        "The distribution is uneven: most OSDs sit at 76-84%, but osd.14 is at 91.2% (backfillfull) and climbing. Backfill keeps targeting it. Client IO still works, but at this rate osd.14 crosses 95% in roughly two hours and every pool it serves stops accepting writes.",
        "הפיזור לא אחיד: רוב ה-OSDs יושבים על 76-84%, אבל osd.14 על 91.2% ‏(backfillfull) ועולה. ה-backfill ממשיך לכוון אליו. ה-IO של ה-clients עדיין עובד, אבל בקצב הזה osd.14 יעבור את ה-95% בעוד בערך שעתיים, וכל pool שהוא משרת יפסיק לקבל כתיבות."
      ),
      data: `$ ceph osd df tree | sort -k17 -n | tail -5     # (columns trimmed)
ID  CLASS  WEIGHT   REWEIGHT  SIZE     USE      AVAIL    %USE   VAR   PGS  STATUS
 9  ssd    1.81940  1.00000   1.8 TiB  1.5 TiB  290 GiB  84.4   1.02  133  up
21  ssd    1.81940  1.00000   1.8 TiB  1.5 TiB  282 GiB  84.9   1.03  135  up
14  ssd    1.81940  1.00000   1.8 TiB  1.7 TiB  164 GiB  91.2   1.10  146  up
$ ceph balancer status
{ "active": false, "mode": "none" }`,
      choices: [
        { label: t("Turn on the upmap balancer and lower osd.14's reweight a little (e.g. 0.90) to move PGs off it.", "להפעיל את ה-upmap balancer ולהוריד קצת את ה-reweight של osd.14 (למשל ל-0.90) כדי להזיז ממנו PGs."), next: "s3", score: 10,
          feedback: t("Good. The balancer was off — that's why one OSD carries 146 PGs. Small, gradual reweights move data away from the hottest OSD without a huge reshuffle.", "טוב. ה-balancer היה כבוי — בגלל זה OSD אחד נושא 146 PGs. ‏Reweights קטנים והדרגתיים מזיזים נתונים מה-OSD הכי חם בלי ערבוב ענק.") },
        { label: t("Mark osd.14 out so nothing more lands on it.", "לסמן את osd.14 כ-out כדי ששום דבר נוסף לא ינחת עליו."), next: "s3", score: 2,
          feedback: t("This pushes all 1.7 TiB of osd.14 onto OSDs that are already at 84%: you'll create several new backfillfull OSDs. Out is for failed disks, not for balancing.", "זה דוחף את כל ה-1.7 TiB של osd.14 ל-OSDs שכבר על 84%: תיצור כמה OSDs חדשים במצב backfillfull. ‏Out זה לדיסקים שנכשלו, לא לאיזון.") },
        { label: t("Start deleting the biggest RBD images you can find to free space fast.", "להתחיל למחוק את ה-images הכי גדולים של RBD שאתה מוצא כדי לפנות מקום מהר."), next: "lose", score: 0,
          feedback: t("Deleting production data without owners' approval is how an incident becomes a career event. And freeing space doesn't help if osd.14 stays the hot spot.", "למחוק נתוני פרודקשן בלי אישור של הבעלים זה בדיוק איך אירוע הופך לאירוע קריירה. וגם פינוי מקום לא עוזר אם osd.14 נשאר ה-hot spot.") }
      ]
    },
    s3: {
      text: t(
        "osd.14 drops to 86% and backfill_toofull clears. But the real problem remains: raw usage is ~83% across the cluster, and the 9 recovering PGs still need about 1.6 TiB of free space. A replacement disk arrives tomorrow; there's also a spare server (node5, 6 × 1.92 TB SSD) racked for next quarter. The storage owner confirms a 'tmp-migration' pool with 1.1 TiB of week-old RBD snapshots can go.",
        "osd.14 יורד ל-86% וה-backfill_toofull נעלם. אבל הבעיה האמיתית נשארת: השימוש הגולמי הוא בערך 83% בכל ה-cluster, ול-9 ה-PGs שמתאוששים עדיין צריך בערך 1.6 TiB פנויים. דיסק חלופי מגיע מחר; יש גם שרת ספייר (node5, ‏6 × 1.92 TB SSD) שכבר בארון בשביל הרבעון הבא. הבעלים של האחסון מאשר שאפשר למחוק pool בשם 'tmp-migration' עם 1.1 TiB של snapshots של RBD בני שבוע."
      ),
      data: `$ ceph df
--- RAW STORAGE ---
CLASS  SIZE     AVAIL    USED     RAW USED  %RAW USED
ssd    41.8 TiB  7.1 TiB  34.7 TiB  34.7 TiB   83.0
--- POOLS ---
POOL           ID  PGS  STORED   OBJECTS  USED     %USED  MAX AVAIL
rbd-prod        2  512  10.4 TiB   2.7M   31.2 TiB  88.1   1.4 TiB
tmp-migration   5   64  1.1 TiB   290k    3.3 TiB  70.2   1.4 TiB`,
      choices: [
        { label: t("Do both: delete the approved snapshots now, then add node5's OSDs gradually (start at low CRUSH weight and ramp up).", "לעשות את שניהם: למחוק עכשיו את ה-snapshots שאושרו, ואז להוסיף את ה-OSDs של node5 בהדרגה (להתחיל ב-CRUSH weight נמוך ולהעלות)."), next: "s4", score: 10,
          feedback: t("Best combo. Deleting 1.1 TiB stored frees ~3.3 TiB raw (3x) immediately, and node5 adds ~10.5 TiB raw so you're no longer one failure away from full.", "השילוב הכי טוב. מחיקה של 1.1 TiB ‏stored משחררת מיד בערך 3.3 TiB גולמי (3x), ו-node5 מוסיף בערך 10.5 TiB גולמי, כך שאתה כבר לא במרחק כשל אחד מ-full.") },
        { label: t("Just wait for tomorrow's replacement disk.", "פשוט לחכות לדיסק החלופי של מחר."), next: "s4", score: 3,
          feedback: t("One 1.8 TiB disk barely covers what the failed OSD held; at 83% raw you'd still be one more failure away from blocked writes. You got lucky this time.", "דיסק אחד של 1.8 TiB בקושי מכסה את מה שה-OSD שנכשל החזיק; ב-83% גולמי עדיין היית במרחק כשל אחד מכתיבות חסומות. הפעם היה לך מזל.") },
        { label: t("Set the pool's size to 2 to instantly free a third of the space.", "לשנות את ה-size של ה-pool ל-2 כדי לפנות מיד שליש מהמקום."), next: "lose", score: 0,
          feedback: t("size=2 (with min_size forced to 1 to stay writable) means a single disk failure during recovery can lose acknowledged writes. You'd trade a capacity problem for a data-loss risk on 300 VMs.", "size=2 (עם min_size שנאלץ לרדת ל-1 כדי להמשיך לכתוב) אומר שכשל של דיסק אחד בזמן התאוששות יכול לאבד כתיבות שכבר אושרו. היית מחליף בעיית קיבולת בסיכון לאובדן נתונים של 300 VMs.") }
      ]
    },
    s4: {
      text: t(
        "node5's OSDs are in and backfill is moving data onto them. Then the app team pings you: database VMs' disk latency jumped from ~4 ms to ~70 ms p99, and a checkout service is timing out. Recovery is competing with client IO.",
        "ה-OSDs של node5 בפנים וה-backfill מזיז אליהם נתונים. ואז צוות האפליקציה פונה אליך: ה-latency של הדיסקים ב-VMs של מסדי הנתונים קפץ מבערך 4 ms לבערך 70 ms ב-p99, ושירות checkout נכנס ל-timeouts. ההתאוששות מתחרה ב-IO של ה-clients."
      ),
      data: `$ ceph -s | sed -n '/io:/,$p'
  io:
    client:   95 MiB/s rd, 40 MiB/s wr, 1.4k op/s rd, 0.9k op/s wr
    recovery: 1.9 GiB/s, 520 objects/s
$ ceph config get osd osd_mclock_profile
high_recovery_ops`,
      choices: [
        { label: t("Switch mClock to high_client_ops during business hours and back to high_recovery_ops tonight.", "להעביר את mClock ל-high_client_ops בשעות העבודה ולהחזיר ל-high_recovery_ops בלילה."), next: "s5", score: 10,
          feedback: t("Exactly. Capacity is safe now; recovery can run slower by day. Client latency returns to normal while redundancy still heals.", "בדיוק. הקיבולת כבר בטוחה; ההתאוששות יכולה לרוץ לאט יותר ביום. ה-latency של ה-clients חוזר לנורמה וה-redundancy ממשיך להשתקם.") },
        { label: t("Set nobackfill and norecover and leave them until the weekend.", "להגדיר nobackfill ו-norecover ולהשאיר אותם עד סוף השבוע."), next: "s5", score: 3,
          feedback: t("Latency recovers, but 22 PGs stay degraded for days — one more disk failure and some PGs drop below min_size and stop serving IO. Throttle, don't freeze.", "ה-latency מתאושש, אבל 22 PGs נשארים degraded במשך ימים — עוד כשל דיסק אחד וחלק מה-PGs יורדים מתחת ל-min_size ומפסיקים לשרת IO. מאטים, לא מקפיאים.") },
        { label: t("Ignore it; recovery will finish eventually.", "להתעלם; ההתאוששות תסתיים מתישהו."), next: "lose", score: 0,
          feedback: t("Checkout timing out for hours is a customer-facing outage you could have fixed with one config command.", "Checkout עם timeouts במשך שעות זה outage מול לקוחות שיכולת לתקן עם פקודת config אחת.") }
      ]
    },
    s5: {
      text: t(
        "By the next morning: HEALTH_OK, all PGs active+clean, raw usage 64% with node5 included. Time for the postmortem action items. Which set do you push for?",
        "בבוקר שלמחרת: HEALTH_OK, כל ה-PGs ב-active+clean, ושימוש גולמי של 64% כולל node5. הגיע הזמן ל-action items של ה-postmortem. על איזה סט אתה דוחף?"
      ),
      data: `$ ceph health
HEALTH_OK
$ ceph osd df | tail -2
                       TOTAL  52.3 TiB  33.6 TiB  18.7 TiB  64.2%
MIN/MAX VAR: 0.94/1.05  STDDEV: 1.91`,
      choices: [
        { label: t("Keep the balancer on (upmap), alert at 75% raw and on max OSD %USE > 80%, capacity rule 'stay below nearfull after losing one host', and a disk-replacement SLA.", "להשאיר את ה-balancer פעיל (upmap), ‏alert ב-75% גולמי וכש-%USE המקסימלי של OSD עובר 80%, כלל קיבולת 'להישאר מתחת ל-nearfull אחרי אובדן host', ו-SLA להחלפת דיסקים."), next: "win", score: 10,
          feedback: t("These address the real causes: no balancing, alerting too late, and no failure headroom in capacity planning.", "אלה מטפלים בסיבות האמיתיות: אין איזון, alerting מאוחר מדי, ואין מרווח לכשל בתכנון הקיבולת.") },
        { label: t("Raise nearfull to 0.92 so it doesn't page so early next time.", "להעלות את nearfull ל-0.92 כדי שבפעם הבאה זה לא יקפיץ כל כך מוקדם."), next: "lose", score: 0,
          feedback: t("That deletes your warning time. Next failure you'll find out at backfillfull, with no room left to recover.", "זה מוחק לך את זמן ההתרעה. בכשל הבא תגלה את זה ב-backfillfull, בלי מקום להתאושש.") }
      ]
    },
    win: {
      text: t(
        "Incident closed with no blocked writes and no data loss. You diagnosed per-OSD imbalance instead of trusting the cluster average, freed space safely with owner approval, added capacity gradually, protected client latency during recovery, and fixed the alerting and capacity rules that let it get this close.",
        "האירוע נסגר בלי כתיבות חסומות ובלי אובדן נתונים. אבחנת חוסר איזון ברמת ה-OSD במקום לסמוך על הממוצע של ה-cluster, פינית מקום בבטחה עם אישור הבעלים, הוספת קיבולת בהדרגה, הגנת על ה-latency של ה-clients בזמן ההתאוששות, ותיקנת את ה-alerting ואת כללי הקיבולת שאפשרו להגיע כל כך קרוב."
      ),
      end: "win"
    },
    lose: {
      text: t(
        "osd.14 crossed 95%, the cluster flagged pools full, and 300 VMs froze on writes — databases crashed, filesystems went read-only. Recovery took a long night of emergency ratio changes and deletions. Lesson: in Ceph, capacity is per-OSD, the ratios are guard rails not obstacles, and you fix imbalance and add capacity before it's urgent.",
        "osd.14 עבר את ה-95%, ה-cluster סימן pools כמלאים, ו-300 VMs קפאו על כתיבות — מסדי נתונים קרסו, filesystems עברו ל-read-only. ההתאוששות לקחה לילה ארוך של שינויי ratio ומחיקות בחירום. הלקח: ב-Ceph הקיבולת נמדדת לכל OSD, ה-ratios הם מעקות בטיחות ולא מכשולים, ואת חוסר האיזון ואת הקיבולת מתקנים לפני שזה דחוף."
      ),
      end: "lose"
    }
  },
  lessons: ["distributed-storage-ceph", "raid-levels-deep", "virtualization-deep"]
});
})();
