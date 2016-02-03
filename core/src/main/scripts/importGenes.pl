#!/usr/bin/perl
require "../scripts/env.pl";

system ("$JAVA_HOME/bin/java -Dspring.profiles.active=dbcp -Xmx1524M -cp $cp -DPORTAL_HOME='$portalHome' org.mskcc.cbio.portal.scripts.ImportGeneData @ARGV");
