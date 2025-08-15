npm exec prisma migrate dev
npx prisma init
npx prisma db pull --schema=prisma/user-schema.prisma
npx prisma db pull --schema=prisma/project-schema.prisma
npx prisma generate --schema=prisma/user-schema.prisma
npx prisma generate --schema=prisma/project-schema.prisma
npx prisma migrate dev --name {name}

# 建立 container

# 1. 修改 Dockerfile 后，直接用远程仓库标签构建

docker build -t ghcr.io/sa556693828/legal-lens-frontend:latest .
./docker-build.sh

# 2. 将构建好的镜像推送到远程仓库

docker push ghcr.io/sa556693828/legal-lens-frontend:latest

#

docker ps -a

kubectl get configmaps --all-namespaces
kubectl apply -f ~/lens_legal/kubernetes/configmap.yaml
kubectl apply -f ~/lens_legal/kubernetes/secret.yaml
kubectl rollout restart deployment legal-lens-frontend

echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
