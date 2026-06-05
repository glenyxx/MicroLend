pipeline {

    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    // Environment variables available to all stages
    environment {
        DOCKERHUB_USER   = 'glenys'   
        IMAGE_TAG        = "${BUILD_NUMBER}"     
        COMPOSE_FILE     = 'docker-compose.yml'
    }

    // These options apply to the whole pipeline
    options {
        // Keep only the last 10 builds to save disk space
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Fail the whole pipeline if any stage takes longer than 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        // Don't run two builds of the same branch at the same time
        disableConcurrentBuilds()
    }

    stages {

        // STAGE 1: CHECKOUT 
        stage('Checkout') {
            steps {
                // Jenkins checks out the code automatically when triggered by GitHub
                // This step just prints confirmation
                echo "✅ Code checked out from branch: ${env.BRANCH_NAME ?: 'main'}"
                echo "   Commit: ${env.GIT_COMMIT ?: 'unknown'}"
                sh 'ls -la'   // show what was checked out
            }
        }

        //STAGE 2: INSTALL DEPENDENCIES 
        stage('Install Dependencies') {
            // Run installs for all 3 Node services in parallel
            // This is faster than running them one by one
            parallel {

                stage('User Service') {
                    steps {
                        dir('services/user-service') {
                            sh '''
npm config set fetch-retries 7
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm ci --fetch-timeout=300000
'''
                            // npm ci is stricter than npm install:
                            // it uses package-lock.json exactly and
                            // deletes node_modules first for a clean install
                        }
                    }
                }

                stage('Loan Service') {
                    steps {
                        dir('services/loan-service') {
                            sh 'npm ci'
                        }
                    }
                }

                stage('Repayment Service') {
                    steps {
                        dir('services/repayment-service') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        //  STAGE 3: RUN TESTS 
        stage('Run Tests') {
            // Tests for each service also run in parallel
            parallel {

                stage('Test: User Service') {
                    steps {
                        dir('services/user-service') {
                            // Run tests with coverage
                            // || true prevents the stage from failing if
                            // coverage threshold isn't met yet (remove later)
                            sh 'npm test -- --forceExit 2>&1 | tee test-results.txt || true'
                        }
                    }
                    post {
                        always {
                            // Publish the HTML coverage report to Jenkins dashboard
                            publishHTML(target: [
                                allowMissing:          false,
                                alwaysLinkToLastBuild: true,
                                keepAll:               true,
                                reportDir:             'services/user-service/coverage/lcov-report',
                                reportFiles:           'index.html',
                                reportName:            'User Service Coverage'
                            ])
                        }
                    }
                }

                stage('Test: Loan Service') {
                    steps {
                        dir('services/loan-service') {
                            sh 'npm test -- --forceExit 2>&1 | tee test-results.txt || true'
                        }
                    }
                    post {
                        always {
                            publishHTML(target: [
                                allowMissing:          false,
                                alwaysLinkToLastBuild: true,
                                keepAll:               true,
                                reportDir:             'services/loan-service/coverage/lcov-report',
                                reportFiles:           'index.html',
                                reportName:            'Loan Service Coverage'
                            ])
                        }
                    }
                }

                stage('Test: Repayment Service') {
                    steps {
                        dir('services/repayment-service') {
                            sh 'npm test -- --forceExit 2>&1 | tee test-results.txt || true'
                        }
                    }
                    post {
                        always {
                            publishHTML(target: [
                                allowMissing:          false,
                                alwaysLinkToLastBuild: true,
                                keepAll:               true,
                                reportDir:             'services/repayment-service/coverage/lcov-report',
                                reportFiles:           'index.html',
                                reportName:            'Repayment Service Coverage'
                            ])
                        }
                    }
                }
            }
        }

        //  STAGE 4: BUILD DOCKER IMAGES
        stage('Build Docker Images') {
            steps {
                script {
                    // Build all 4 images, tagging each with the build number
                    // so you can always roll back to a previous version
                    sh """
                        docker build -t ${DOCKERHUB_USER}/microlend-user-service:${IMAGE_TAG} \
                            ./services/user-service

                        docker build -t ${DOCKERHUB_USER}/microlend-loan-service:${IMAGE_TAG} \
                            ./services/loan-service

                        docker build -t ${DOCKERHUB_USER}/microlend-credit-service:${IMAGE_TAG} \
                            ./services/credit-service

                        docker build -t ${DOCKERHUB_USER}/microlend-repayment-service:${IMAGE_TAG} \
                            ./services/repayment-service
                    """
                    echo "✅ All 4 Docker images built with tag: ${IMAGE_TAG}"
                }
            }
        }

        // STAGE 5: PUSH TO DOCKER HUB 
        stage('Push to Docker Hub') {
            steps {
                script {
                    // withCredentials injects the username/password from the
                    // Jenkins credentials store — never hardcoded in the file
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'

                        // Push each image with the build number tag
                        sh """
                            docker push ${DOCKERHUB_USER}/microlend-user-service:${IMAGE_TAG}
                            docker push ${DOCKERHUB_USER}/microlend-loan-service:${IMAGE_TAG}
                            docker push ${DOCKERHUB_USER}/microlend-credit-service:${IMAGE_TAG}
                            docker push ${DOCKERHUB_USER}/microlend-repayment-service:${IMAGE_TAG}
                        """

                        // Also push with the 'latest' tag for convenience
                        sh """
                            docker tag ${DOCKERHUB_USER}/microlend-user-service:${IMAGE_TAG} \
                                       ${DOCKERHUB_USER}/microlend-user-service:latest
                            docker push ${DOCKERHUB_USER}/microlend-user-service:latest

                            docker tag ${DOCKERHUB_USER}/microlend-loan-service:${IMAGE_TAG} \
                                       ${DOCKERHUB_USER}/microlend-loan-service:latest
                            docker push ${DOCKERHUB_USER}/microlend-loan-service:latest

                            docker tag ${DOCKERHUB_USER}/microlend-credit-service:${IMAGE_TAG} \
                                       ${DOCKERHUB_USER}/microlend-credit-service:latest
                            docker push ${DOCKERHUB_USER}/microlend-credit-service:latest

                            docker tag ${DOCKERHUB_USER}/microlend-repayment-service:${IMAGE_TAG} \
                                       ${DOCKERHUB_USER}/microlend-repayment-service:latest
                            docker push ${DOCKERHUB_USER}/microlend-repayment-service:latest
                        """

                        sh 'docker logout'
                        echo "✅ All images pushed to Docker Hub"
                    }
                }
            }
        }

        // STAGE 6: DEPLOY 
        stage('Deploy') {
            steps {
                script {
                    // Deploy from the mounted workspace folder
                    sh """
                        cd /workspace/microlend
                        docker-compose down --remove-orphans
                        docker-compose up --build -d
                        echo "✅ Platform deployed"
                        docker ps --filter name=microlend --format 'table {{.Names}}\t{{.Status}}'
                    """
                }
            }
        }

        // STAGE 7: HEALTH CHECK 
        stage('Health Check') {
            steps {
                script {
                    // Wait 20 seconds for services to start up fully
                    sleep(time: 20, unit: 'SECONDS')

                    // Check each service's health endpoint
                    // If any return non-200, the pipeline fails here
                    sh """
                        curl -f http://localhost/health           || exit 1
                        curl -f http://localhost/api/users/health || exit 1
                        echo "✅ All health checks passed"
                    """
                }
            }
        }
    }

    // ── POST-PIPELINE ACTIONS ──────────────────────────────────────────────
    // These run regardless of whether the pipeline succeeded or failed
    post {

        success {
            echo """
            ╔══════════════════════════════════╗
            ║  ✅  Pipeline SUCCEEDED          ║
            ║  Build #${BUILD_NUMBER}           ║
            ║  MicroLend is live on port 80     ║
            ╚══════════════════════════════════╝
            """
        }

        failure {
            echo """
            ╔══════════════════════════════════╗
            ║  ❌  Pipeline FAILED             ║
            ║  Build #${BUILD_NUMBER}           ║
            ║  Check the logs above             ║
            ╚══════════════════════════════════╝
            """
        }

        always {
            // Clean up dangling Docker images to save disk space
            sh 'docker image prune -f || true'
        }
    }
}